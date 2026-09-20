"""
app/routers/students.py — Student registration (public) + admin CRUD

Public:
  POST /api/students/register

Admin (JWT required):
  GET    /api/admin/students
  GET    /api/admin/students/{id}
  PUT    /api/admin/students/{id}
  DELETE /api/admin/students/{id}              (soft-delete)
  POST   /api/admin/students/{id}/restore
  DELETE /api/admin/students/{id}/purge
  DELETE /api/admin/recycle-bin/empty
  POST   /api/admin/students/{id}/photo
  POST   /api/admin/students/{id}/signature
"""
import asyncio
from collections import defaultdict
from datetime import datetime, timezone
import re
import time
from typing import Optional
import uuid
from uuid import UUID

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.r2_storage import (
    delete_media,
    delete_media_batch,
    get_presigned_url,
    upload_media,
    validate_image_dimensions,
)
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, Course, Section, SystemSettings
from app.models.student import Student, RegistrationStatus
from app.schemas.student import (
    PhotoUploadRequest,
    RegisterResponse,
    SignatureUploadRequest,
    StudentOut,
    StudentRegisterRequest,
    StudentUpdateRequest,
)

# Imported lazily to avoid circular imports; called after any write that mutates counts
def _bust_cache():
    try:
        from app.routers.admin import bust_dashboard_cache
        bust_dashboard_cache()
    except Exception:
        pass

router = APIRouter(tags=["students"])

# ── Registration Rate Limiter ───────────────────────────────────────────────────
# SEC-02: Rate-limit the public registration endpoint to prevent flood attacks
# and R2 storage abuse. 30 submissions per IP per 10 minutes accommodates
# multi-device use on a shared campus network (labs, mobile hotspots, etc.).
# For multi-worker deployments, replace with a Redis-backed solution.
_registration_attempts: dict[str, list[float]] = defaultdict(list)
_REG_MAX_ATTEMPTS = 30
_REG_WINDOW_SECONDS = 600  # 10 minutes


def _check_registration_rate_limit(client_ip: str) -> None:
    """Raise 429 if the IP has exceeded the registration rate limit."""
    now = time.time()
    window_start = now - _REG_WINDOW_SECONDS
    attempts = [t for t in _registration_attempts[client_ip] if t > window_start]
    _registration_attempts[client_ip] = attempts
    if len(attempts) >= _REG_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many registration attempts from this network. Please wait {_REG_WINDOW_SECONDS // 60} minutes.",
            headers={"Retry-After": str(_REG_WINDOW_SECONDS)},
        )
    _registration_attempts[client_ip].append(now)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _year_label_to_int(year_label: str) -> int:
    """Convert '1st Year' / '2nd Year' etc. to integer 1 / 2 …"""
    mapping = {"1st year": 1, "2nd year": 2, "3rd year": 3, "4th year": 4, "5th year": 5}
    return mapping.get(year_label.lower(), 1)


def _student_to_out(student: Student) -> StudentOut:
    """Serialize a Student ORM object to StudentOut, generating presigned media URLs."""
    return StudentOut(
        id=student.id,
        student_number=student.student_number,
        first_name=student.first_name,
        middle_name=student.middle_name,
        last_name=student.last_name,
        gender=student.gender,
        birth_date=student.birth_date,
        email=student.email,
        status=student.status,
        organization=student.organization,
        course_code=student.course.code if student.course else None,
        course_name=student.course.name if student.course else None,
        section_name=student.section.name if student.section else None,
        year_level=student.section.year_level if student.section else None,
        academic_year=student.academic_year.name if student.academic_year else None,
        perm_strt=student.perm_strt,
        perm_bldg=student.perm_bldg,
        perm_dstr=student.perm_dstr,
        perm_city=student.perm_city,
        perm_stad=student.perm_stad,
        perm_ctry=student.perm_ctry,
        perm_post=student.perm_post,
        contact_person_name=student.contact_person_name,
        contact_person_number=student.contact_person_number,
        contact_person_number2=student.contact_person_number2,
        contact_person_number3=student.contact_person_number3,
        contact_strt=student.contact_strt,
        contact_bldg=student.contact_bldg,
        contact_dstr=student.contact_dstr,
        contact_city=student.contact_city,
        contact_stad=student.contact_stad,
        contact_ctry=student.contact_ctry,
        contact_post=student.contact_post,
        photo_url=get_presigned_url(student.photo_r2_key),
        signature_url=get_presigned_url(student.signature_r2_key),
        created_at=student.created_at,
        updated_at=student.updated_at,
        deleted_at=student.deleted_at,
    )


def _with_relations():
    return (
        selectinload(Student.course),
        selectinload(Student.section),
        selectinload(Student.academic_year),
    )


class PublicSectionOut(BaseModel):
    id: UUID
    name: str
    year_level: int
    model_config = {"from_attributes": True}


class PublicProgramOut(BaseModel):
    code: str
    name: str
    org: str
    sections: list[str]
    sections_detail: list[PublicSectionOut]


# In-memory public programs cache: dict[str, tuple[float, list[PublicProgramOut]]] keyed by active_ay_id
_public_programs_cache_by_ay: dict[str, tuple[float, list[PublicProgramOut]]] = {}


def bust_public_programs_cache():
    global _public_programs_cache_by_ay
    _public_programs_cache_by_ay.clear()


# ── Public: Academic Programs & Sections ──────────────────────────────────────

@router.get("/api/students/programs", response_model=list[PublicProgramOut])
async def get_public_programs(
    db: AsyncSession = Depends(get_db),
):
    global _public_programs_cache_by_ay

    # Resolve active AY to only show sections for the current registration period
    settings_result = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_result.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None
    cache_key = str(active_ay_id) if active_ay_id else "none"

    if cache_key in _public_programs_cache_by_ay:
        cached_time, cached_data = _public_programs_cache_by_ay[cache_key]
        if time.time() - cached_time < 300:  # 5 min TTL
            return cached_data

    result = await db.execute(
        select(Course)
        .options(selectinload(Course.organization), selectinload(Course.sections))
        .order_by(Course.code)
    )
    courses = result.scalars().all()
    out = []
    for c in courses:
        # Filter sections to the active AY; fall back to unscoped sections if no AY set
        if active_ay_id:
            ay_sections = [s for s in c.sections if s.academic_year_id == active_ay_id]
        else:
            ay_sections = c.sections

        sorted_secs = sorted(
            ay_sections,
            key=lambda s: [int(t) if t.isdigit() else t for t in s.name.replace('-', ' ').split()]
        )
        sec_names = [s.name for s in sorted_secs]
        out.append(
            PublicProgramOut(
                code=c.code,
                name=c.name,
                org=c.organization.code if c.organization else "",
                sections=sec_names,
                sections_detail=[
                    PublicSectionOut(id=s.id, name=s.name, year_level=s.year_level)
                    for s in sorted_secs
                ],
            )
        )
    _public_programs_cache_by_ay[cache_key] = (time.time(), out)
    return out


# ── Public: Student Registration ──────────────────────────────────────────────

@router.post("/api/students/register", response_model=RegisterResponse)
async def register_student(
    payload: StudentRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # SEC-02: Rate limit by client IP before any DB or media work
    client_ip = request.client.host if request.client else "unknown"
    _check_registration_rate_limit(client_ip)

    # Check registration is open
    settings_result = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_result.scalar_one_or_none()
    if sys_settings and not sys_settings.registration_open:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student registration is currently closed.",
        )

    # Duplicate check
    existing = await db.execute(
        select(Student.id).where(Student.student_number == payload.student_number.strip().upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student number '{payload.student_number}' is already registered.",
        )

    # Resolve course
    course_result = await db.execute(
        select(Course).where(func.upper(Course.code) == payload.course.strip().upper())
    )
    course = course_result.scalar_one_or_none()

    # Active academic year
    settings_result_ay = await db.execute(select(SystemSettings).limit(1))
    sys_settings_ay = settings_result_ay.scalar_one_or_none()
    active_ay = None
    if sys_settings_ay and sys_settings_ay.active_ay_id:
        ay_result = await db.execute(
            select(AcademicYear).where(AcademicYear.id == sys_settings_ay.active_ay_id)
        )
        active_ay = ay_result.scalar_one_or_none()
    if not active_ay:
        ay_result = await db.execute(
            select(AcademicYear).where(AcademicYear.is_active == True).limit(1)
        )
        active_ay = ay_result.scalar_one_or_none()

    # Resolve section (scoped to active AY)
    section = None
    if course:
        year_int = _year_label_to_int(payload.year_level)
        sec_query = select(Section).where(
            Section.course_id == course.id,
            Section.year_level == year_int,
            func.upper(Section.name) == payload.section.strip().upper(),
        )
        if active_ay:
            sec_query = sec_query.where(Section.academic_year_id == active_ay.id)
        sec_result = await db.execute(sec_query)
        section = sec_result.scalars().first()
        # If not found by year_level + name, try by name alone in this course
        if not section:
            fallback_query = select(Section).where(
                Section.course_id == course.id,
                func.upper(Section.name) == payload.section.strip().upper(),
            )
            if active_ay:
                fallback_query = fallback_query.where(Section.academic_year_id == active_ay.id)
            fallback_sec = await db.execute(fallback_query)
            section = fallback_sec.scalars().first()

    # Phase 1.7: Server-side media validation offloaded to worker threads
    PHOTO_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
    SIG_MAX_BYTES = 10 * 1024 * 1024  # 10 MB

    validation_tasks = []
    if payload.photo_data:
        validation_tasks.append(
            asyncio.to_thread(
                validate_image_dimensions,
                payload.photo_data,
                1500,
                1500,
                PHOTO_MAX_BYTES,
            )
        )
    else:
        validation_tasks.append(asyncio.sleep(0, result=(True, "")))

    if payload.signature_data:
        validation_tasks.append(
            asyncio.to_thread(
                validate_image_dimensions,
                payload.signature_data,
                2000,
                1200,
                SIG_MAX_BYTES,
            )
        )
    else:
        validation_tasks.append(asyncio.sleep(0, result=(True, "")))

    (photo_valid, photo_err), (sig_valid, sig_err) = await asyncio.gather(*validation_tasks)

    if not photo_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid photo: {photo_err}",
        )
    if not sig_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid signature: {sig_err}",
        )

    # Phase 2.2: Server-side emergency contact number length validation
    contact_number = (payload.emergency_contact_number or "").strip()
    digits_only = re.sub(r"\D", "", contact_number)
    if len(digits_only) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Emergency contact number must contain at least 10 digits.",
        )

    # Generate student UUID upfront so media keys can be built before opening a DB transaction
    student_id = uuid.uuid4()

    # Format name for Cloudflare R2: Surname, First Name Middle Initial
    media_name = f"{payload.last_name.strip().upper()}, {payload.first_name.strip().upper()}"
    if payload.middle_name and payload.middle_name.strip():
        media_name += f" {payload.middle_name.strip()[0].upper()}."

    # Upload photo & signature to Cloudflare R2 concurrently in worker threads (never blocks asyncio loop)
    upload_tasks = []
    if payload.photo_data:
        upload_tasks.append(
            asyncio.to_thread(upload_media, payload.photo_data, str(student_id), "photo", filename=media_name)
        )
    else:
        upload_tasks.append(asyncio.sleep(0, result=None))

    if payload.signature_data:
        upload_tasks.append(
            asyncio.to_thread(upload_media, payload.signature_data, str(student_id), "signature", filename=media_name)
        )
    else:
        upload_tasks.append(asyncio.sleep(0, result=None))

    upload_results = await asyncio.gather(*upload_tasks, return_exceptions=True)
    photo_r2_key = upload_results[0] if not isinstance(upload_results[0], Exception) else None
    if isinstance(upload_results[0], Exception):
        print(f"[WARN] Photo upload failed: {upload_results[0]}")

    signature_r2_key = upload_results[1] if not isinstance(upload_results[1], Exception) else None
    if isinstance(upload_results[1], Exception):
        print(f"[WARN] Signature upload failed: {upload_results[1]}")

    # Create and commit student record in a single atomic database operation (<10ms transaction)
    student = Student(
        id=student_id,
        student_number=payload.student_number.strip().upper(),
        first_name=payload.first_name.strip().upper(),
        middle_name=(payload.middle_name or "").strip().upper() or None,
        last_name=payload.last_name.strip().upper(),
        gender=payload.gender or "Male",
        birth_date=payload.birthdate,
        email=payload.email.strip().lower(),
        organization=payload.organization,
        course_id=course.id if course else None,
        section_id=section.id if section else None,
        academic_year_id=active_ay.id if active_ay else None,
        perm_strt=payload.residential_address.strip(),
        contact_person_name=payload.emergency_contact_name.strip().upper(),
        contact_person_number=contact_number,
        contact_strt=payload.emergency_address.strip(),
        photo_r2_key=photo_r2_key,
        signature_r2_key=signature_r2_key,
        status=RegistrationStatus.PENDING,
    )

    db.add(student)
    await db.commit()

    _bust_cache()

    return RegisterResponse(
        success=True,
        registration_id=str(student.id),
        student_number=student.student_number,
        message="Registration submitted successfully. Please wait for admin approval.",
    )


# ── Admin: Student List ────────────────────────────────────────────────────────

@router.get("/api/admin/students")
async def list_students(
    search: Optional[str] = Query(default=None),
    program: Optional[str] = Query(default=None),
    section: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    academic_year_id: Optional[UUID] = Query(default=None),
    all_years: bool = Query(default=False),
    deleted: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    q = select(Student).options(*_with_relations())

    if deleted:
        q = q.where(Student.deleted_at.isnot(None))
        if academic_year_id:
            q = q.where(Student.academic_year_id == academic_year_id)
        elif academic_year:
            clean_ay = academic_year.replace("AY", "").strip()
            ay_res = await db.execute(select(AcademicYear.id).where(AcademicYear.name == clean_ay))
            target_ay_id = ay_res.scalar_one_or_none()
            if target_ay_id:
                q = q.where(Student.academic_year_id == target_ay_id)
    else:
        q = q.where(Student.deleted_at.is_(None))
        if not all_years:
            if academic_year_id:
                q = q.where(Student.academic_year_id == academic_year_id)
            elif academic_year:
                clean_ay = academic_year.replace("AY", "").strip()
                ay_res = await db.execute(select(AcademicYear.id).where(AcademicYear.name == clean_ay))
                target_ay_id = ay_res.scalar_one_or_none()
                if target_ay_id:
                    q = q.where(Student.academic_year_id == target_ay_id)
            else:
                settings_res = await db.execute(select(SystemSettings).limit(1))
                sys_settings = settings_res.scalar_one_or_none()
                if sys_settings and sys_settings.active_ay_id:
                    q = q.where(Student.academic_year_id == sys_settings.active_ay_id)

    if search:
        s = f"%{search}%"
        q = q.where(
            or_(
                Student.first_name.ilike(s),
                Student.last_name.ilike(s),
                Student.middle_name.ilike(s),
                Student.student_number.ilike(s),
                Student.email.ilike(s),
            )
        )

    if program:
        course_ids = select(Course.id).where(func.upper(Course.code) == program.strip().upper())
        q = q.where(Student.course_id.in_(course_ids))

    if section:
        sec_ids = select(Section.id).where(func.upper(Section.name) == section.strip().upper())
        q = q.where(Student.section_id.in_(sec_ids))

    if status:
        q = q.where(Student.status == status.upper())

    q = q.order_by(Student.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    students = result.scalars().all()

    return [_student_to_out(s) for s in students]


# ── Admin: Get Student by ID ──────────────────────────────────────────────────

@router.get("/api/admin/students/{student_id}", response_model=StudentOut)
async def get_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Student).options(*_with_relations()).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return _student_to_out(student)


# ── Admin: Update Student ─────────────────────────────────────────────────────

@router.put("/api/admin/students/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: UUID,
    payload: StudentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Student).options(*_with_relations()).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    update_data = payload.model_dump(exclude_none=True)
    photo_data = update_data.pop("photo_data", None)
    signature_data = update_data.pop("signature_data", None)
    course_code = update_data.pop("course_code", None)
    section_name = update_data.pop("section_name", None)
    birth_date_val = update_data.pop("birth_date", None)

    if birth_date_val:
        if isinstance(birth_date_val, str):
            try:
                student.birth_date = datetime.strptime(birth_date_val.strip(), "%Y-%m-%d").date()
            except Exception:
                pass
        elif isinstance(birth_date_val, date):
            student.birth_date = birth_date_val

    if course_code:
        course_res = await db.execute(
            select(Course).where(func.upper(Course.code) == course_code.strip().upper())
        )
        course_obj = course_res.scalar_one_or_none()
        if course_obj:
            student.course_id = course_obj.id

    if section_name:
        target_ay_id = student.academic_year_id
        if not target_ay_id:
            from app.models.config import SystemSettings
            settings_res = await db.execute(select(SystemSettings))
            settings_obj = settings_res.scalars().first()
            if settings_obj and settings_obj.active_ay_id:
                target_ay_id = settings_obj.active_ay_id

        sec_query = select(Section).where(
            func.upper(Section.name) == section_name.strip().upper(),
            Section.course_id == student.course_id,
        )
        if target_ay_id:
            sec_query = sec_query.where(Section.academic_year_id == target_ay_id)
        sec_res = await db.execute(sec_query)
        sec_obj = sec_res.scalars().first()
        if not sec_obj:
            # Fallback across all AYs for this course
            sec_fallback = await db.execute(
                select(Section).where(
                    func.upper(Section.name) == section_name.strip().upper(),
                    Section.course_id == student.course_id,
                )
            )
            sec_obj = sec_fallback.scalars().first()
        if sec_obj:
            student.section_id = sec_obj.id

    for field, value in update_data.items():
        if hasattr(student, field):
            setattr(student, field, value)

    media_name = f"{student.last_name}, {student.first_name}"
    if student.middle_name and student.middle_name.strip():
        media_name += f" {student.middle_name.strip()[0].upper()}."

    if photo_data:
        try:
            photo_r2_key = await asyncio.to_thread(
                upload_media, photo_data, str(student.id), "photo", filename=media_name
            )
            student.photo_r2_key = photo_r2_key
        except Exception as e:
            print(f"[WARN] Photo upload failed during update: {e}")

    if signature_data:
        try:
            sig_r2_key = await asyncio.to_thread(
                upload_media, signature_data, str(student.id), "signature", filename=media_name
            )
            student.signature_r2_key = sig_r2_key
        except Exception as e:
            print(f"[WARN] Signature upload failed during update: {e}")

    student.updated_at = datetime.now(timezone.utc)
    db.add(student)
    await db.commit()

    refreshed = await db.execute(
        select(Student).options(*_with_relations()).where(Student.id == student.id)
    )
    student = refreshed.scalar_one()

    _bust_cache()

    return _student_to_out(student)


# ── Admin: Soft Delete ────────────────────────────────────────────────────────

@router.delete("/api/admin/students/{student_id}")
async def soft_delete_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    student.deleted_at = datetime.now(timezone.utc)
    db.add(student)
    _bust_cache()
    return {"success": True, "id": str(student_id), "message": "Record moved to recycle bin."}


# ── Admin: Restore ────────────────────────────────────────────────────────────

@router.post("/api/admin/students/{student_id}/restore")
async def restore_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    student.deleted_at = None
    db.add(student)
    _bust_cache()
    return {"success": True, "id": str(student_id), "message": "Record restored."}


# ── Admin: Permanent Delete (Purge) ──────────────────────────────────────────

@router.delete("/api/admin/students/{student_id}/purge")
async def purge_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Delete R2 media
    if student.photo_r2_key:
        delete_media(student.photo_r2_key)
    if student.signature_r2_key:
        delete_media(student.signature_r2_key)

    await db.delete(student)
    _bust_cache()
    return {"success": True, "id": str(student_id), "message": "Record permanently deleted."}


# ── Admin: Empty Recycle Bin ──────────────────────────────────────────────────

@router.delete("/api/admin/recycle-bin/empty")
async def empty_recycle_bin(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    # Phase 3.7: Batch deletions in chunks of 50 to avoid memory spikes and long transactions
    total_deleted = 0
    batch_size = 50

    while True:
        result = await db.execute(
            select(Student).where(Student.deleted_at.isnot(None)).limit(batch_size)
        )
        batch = result.scalars().all()
        if not batch:
            break

        keys_to_delete = []
        for s in batch:
            if s.photo_r2_key:
                keys_to_delete.append(s.photo_r2_key)
            if s.signature_r2_key:
                keys_to_delete.append(s.signature_r2_key)
            await db.delete(s)

        # Phase 3.5: Run batch R2 deletion in thread pool
        if keys_to_delete:
            await asyncio.to_thread(delete_media_batch, keys_to_delete)

        await db.commit()
        total_deleted += len(batch)

    _bust_cache()
    return {"success": True, "message": f"Recycle bin purged ({total_deleted} records deleted)."}


# ── Admin: Upload Photo ───────────────────────────────────────────────────────

@router.post("/api/admin/students/{student_id}/photo")
async def upload_photo(
    student_id: UUID,
    payload: PhotoUploadRequest,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Validate photo: 1500×1500 px, max 5 MB
    valid, error = await asyncio.to_thread(
        validate_image_dimensions, payload.photo, 1500, 1500, max_bytes=5 * 1024 * 1024
    )
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    # Delete old photo if exists
    if student.photo_r2_key:
        await asyncio.to_thread(delete_media, student.photo_r2_key)

    new_key = await asyncio.to_thread(upload_media, payload.photo, str(student_id), "photo")
    student.photo_r2_key = new_key
    db.add(student)

    return {"success": True, "photo_url": get_presigned_url(new_key)}


# ── Admin: Upload Signature ───────────────────────────────────────────────────

@router.post("/api/admin/students/{student_id}/signature")
async def upload_signature(
    student_id: UUID,
    payload: SignatureUploadRequest,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Validate signature: 2000×1200 px, max 5 MB
    valid, error = await asyncio.to_thread(
        validate_image_dimensions, payload.signature, 2000, 1200, max_bytes=5 * 1024 * 1024
    )
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    if student.signature_r2_key:
        await asyncio.to_thread(delete_media, student.signature_r2_key)

    new_key = await asyncio.to_thread(upload_media, payload.signature, str(student_id), "signature")
    student.signature_r2_key = new_key
    db.add(student)

    return {"success": True, "signature_url": get_presigned_url(new_key)}


# ── Live Visitor Heartbeat ────────────────────────────────────────────────────
import re  # already imported at top, but kept here for clarity


class HeartbeatRequest(BaseModel):
    session_id: str


# Phase 1.3: Bound the live-visitor dict to prevent unbounded memory growth.
# Maximum 5000 concurrent sessions tracked; oldest are evicted when full.
_MAX_LIVE_VISITORS = 5000
_LIVE_VISITOR_SESSION_RE = re.compile(r'^vis_[a-z0-9]{9,30}$')
_live_visitors: dict[str, float] = {}


def _validate_session_id(session_id: str) -> bool:
    """Accept only syntactically valid visitor session IDs to prevent key injection."""
    return bool(session_id and _LIVE_VISITOR_SESSION_RE.match(session_id))


def record_visitor_heartbeat(session_id: str):
    if not _validate_session_id(session_id):
        return
    # Phase 1.3: Evict oldest entry if at capacity
    if len(_live_visitors) >= _MAX_LIVE_VISITORS and session_id not in _live_visitors:
        oldest_key = next(iter(_live_visitors))
        del _live_visitors[oldest_key]
    _live_visitors[session_id] = time.time()


def remove_visitor_heartbeat(session_id: str):
    if _validate_session_id(session_id):
        _live_visitors.pop(session_id, None)


def get_live_visitor_count(window_seconds: float = 35.0) -> int:
    cutoff = time.time() - window_seconds
    stale = [k for k, t in _live_visitors.items() if t < cutoff]
    for k in stale:
        _live_visitors.pop(k, None)
    return max(1, len(_live_visitors))


@router.post("/api/students/heartbeat")
async def student_heartbeat(payload: HeartbeatRequest):
    record_visitor_heartbeat(payload.session_id)
    return {"success": True, "live_count": get_live_visitor_count()}


@router.post("/api/students/heartbeat/leave")
async def student_heartbeat_leave(payload: HeartbeatRequest):
    remove_visitor_heartbeat(payload.session_id)
    return {"success": True}


@router.get("/api/students/registration-status")
async def get_registration_status(db: AsyncSession = Depends(get_db)):
    """Public endpoint to check if student registration is currently open."""
    try:
        sys_settings = await db.scalar(select(SystemSettings).limit(1))
        is_open = sys_settings.registration_open if sys_settings else True
        return {"is_open": is_open}
    except Exception:
        return {"is_open": True}
