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
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.r2_storage import (
    delete_media,
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


# ── Public: Student Registration ──────────────────────────────────────────────

@router.post("/api/students/register", response_model=RegisterResponse)
async def register_student(
    payload: StudentRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
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

    # Resolve section
    section = None
    if course:
        year_int = _year_label_to_int(payload.year_level)
        sec_result = await db.execute(
            select(Section).where(
                Section.course_id == course.id,
                Section.year_level == year_int,
                func.upper(Section.name) == payload.section.strip().upper(),
            )
        )
        section = sec_result.scalar_one_or_none()

    # Active academic year
    ay_result = await db.execute(
        select(AcademicYear).where(AcademicYear.is_active == True).limit(1)
    )
    active_ay = ay_result.scalar_one_or_none()

    # Upload media to R2 if provided
    photo_r2_key = None
    signature_r2_key = None

    student_id_placeholder = None  # Will be set after creation for R2 key path

    student = Student(
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
        contact_person_number=payload.emergency_contact_number.strip(),
        contact_strt=payload.emergency_address.strip(),
        status=RegistrationStatus.PENDING,
    )

    db.add(student)
    await db.flush()  # Get the generated UUID before uploading media

    # Format name for Cloudflare R2: Surname, First Name Middle Initial
    media_name = f"{student.last_name}, {student.first_name}"
    if student.middle_name and student.middle_name.strip():
        media_name += f" {student.middle_name.strip()[0].upper()}."

    # Upload photo
    if payload.photo_data:
        try:
            photo_r2_key = upload_media(payload.photo_data, str(student.id), "photo", filename=media_name)
            student.photo_r2_key = photo_r2_key
        except Exception as e:
            print(f"[WARN] Photo upload failed: {e}")

    # Upload signature
    if payload.signature_data:
        try:
            sig_r2_key = upload_media(payload.signature_data, str(student.id), "signature", filename=media_name)
            student.signature_r2_key = sig_r2_key
        except Exception as e:
            print(f"[WARN] Signature upload failed: {e}")

    await db.flush()

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
    deleted: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    q = select(Student).options(*_with_relations())

    if deleted:
        q = q.where(Student.deleted_at.isnot(None))
    else:
        q = q.where(Student.deleted_at.is_(None))

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

    for field, value in update_data.items():
        setattr(student, field, value)

    media_name = f"{student.last_name}, {student.first_name}"
    if student.middle_name and student.middle_name.strip():
        media_name += f" {student.middle_name.strip()[0].upper()}."

    if photo_data:
        try:
            photo_r2_key = upload_media(photo_data, str(student.id), "photo", filename=media_name)
            student.photo_r2_key = photo_r2_key
        except Exception as e:
            print(f"[WARN] Photo upload failed during update: {e}")

    if signature_data:
        try:
            sig_r2_key = upload_media(signature_data, str(student.id), "signature", filename=media_name)
            student.signature_r2_key = sig_r2_key
        except Exception as e:
            print(f"[WARN] Signature upload failed during update: {e}")

    student.updated_at = datetime.now(timezone.utc)
    db.add(student)

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
    result = await db.execute(select(Student).where(Student.deleted_at.isnot(None)))
    soft_deleted = result.scalars().all()

    for s in soft_deleted:
        if s.photo_r2_key:
            delete_media(s.photo_r2_key)
        if s.signature_r2_key:
            delete_media(s.signature_r2_key)
        await db.delete(s)

    _bust_cache()
    return {"success": True, "message": f"Recycle bin purged ({len(soft_deleted)} records deleted)."}


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
    valid, error = validate_image_dimensions(payload.photo, 1500, 1500, max_bytes=5 * 1024 * 1024)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    # Delete old photo if exists
    if student.photo_r2_key:
        delete_media(student.photo_r2_key)

    new_key = upload_media(payload.photo, str(student_id), "photo")
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
    valid, error = validate_image_dimensions(
        payload.signature, 2000, 1200, max_bytes=5 * 1024 * 1024
    )
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    if student.signature_r2_key:
        delete_media(student.signature_r2_key)

    new_key = upload_media(payload.signature, str(student_id), "signature")
    student.signature_r2_key = new_key
    db.add(student)

    return {"success": True, "signature_url": get_presigned_url(new_key)}


# ── Live Visitor Heartbeat ────────────────────────────────────────────────────

import time
from pydantic import BaseModel


class HeartbeatRequest(BaseModel):
    session_id: str


_live_visitors: dict[str, float] = {}


def record_visitor_heartbeat(session_id: str):
    if session_id:
        _live_visitors[session_id] = time.time()


def remove_visitor_heartbeat(session_id: str):
    _live_visitors.pop(session_id, None)


def get_live_visitor_count(window_seconds: float = 35.0) -> int:
    cutoff = time.time() - window_seconds
    stale = [k for k, t in _live_visitors.items() if t < cutoff]
    for k in stale:
        _live_visitors.pop(k, None)
    return len(_live_visitors)


@router.post("/api/students/heartbeat")
async def student_heartbeat(payload: HeartbeatRequest):
    record_visitor_heartbeat(payload.session_id)
    return {"success": True, "live_count": get_live_visitor_count()}


@router.post("/api/students/heartbeat/leave")
async def student_heartbeat_leave(payload: HeartbeatRequest):
    remove_visitor_heartbeat(payload.session_id)
    return {"success": True}
