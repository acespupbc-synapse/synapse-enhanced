"""
app/routers/programs.py — Academic programs CRUD endpoints

GET    /api/admin/programs
POST   /api/admin/programs
PUT    /api/admin/programs/{id}
DELETE /api/admin/programs/{id}
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, Course, Organization, Section, SystemSettings
from app.models.student import Student
from app.schemas.programs import (
    CourseCreate,
    CourseOut,
    CourseUpdate,
    SectionCreate,
    SectionItem,
    SectionOut,
    SectionUpdate,
)

import time

router = APIRouter(prefix="/api/admin/programs", tags=["programs"])

# In-memory programs cache: dict[str, tuple[float, list[CourseOut]]] keyed by active_ay_id (or 'none')
_cached_programs_by_ay: dict[str, tuple[float, list[CourseOut]]] = {}


def bust_programs_cache():
    global _cached_programs_by_ay
    _cached_programs_by_ay.clear()
    try:
        from app.routers.admin import bust_dashboard_cache
        bust_dashboard_cache()
    except Exception:
        pass
    try:
        from app.routers.students import bust_public_programs_cache
        bust_public_programs_cache()
    except Exception:
        pass


def _bust_cache():
    bust_programs_cache()


@router.get("", response_model=list[CourseOut])
async def list_programs(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    global _cached_programs_by_ay

    # Resolve active AY so we only show sections for the current AY
    settings_result = await db.execute(
        select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
    )
    sys_settings = settings_result.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None
    cache_key = str(active_ay_id) if active_ay_id else "none"

    if cache_key in _cached_programs_by_ay:
        cached_time, cached_data = _cached_programs_by_ay[cache_key]
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
        # Filter sections to only those for the active AY (or unscoped/legacy if no AY set)
        if active_ay_id:
            ay_sections = [s for s in c.sections if s.academic_year_id == active_ay_id]
        else:
            ay_sections = c.sections

        sorted_secs = sorted(
            ay_sections,
            key=lambda s: [int(t) if t.isdigit() else t for t in s.name.replace('-', ' ').split()]
        )
        sec_names = [s.name for s in sorted_secs]
        sections_detail = [
            SectionItem(id=s.id, name=s.name, year_level=s.year_level)
            for s in sorted_secs
        ]
        out.append(
            CourseOut(
                id=c.id,
                org=c.organization.code if c.organization else "",
                code=c.code,
                name=c.name,
                section_count=len(sec_names),
                sections=sec_names,
                sections_detail=sections_detail,
            )
        )
    _cached_programs_by_ay[cache_key] = (time.time(), out)
    return out


@router.post("/sections", response_model=SectionOut)
async def create_section(
    payload: SectionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    course_res = await db.execute(
        select(Course).where(func.upper(Course.code) == payload.program_code.strip().upper())
    )
    course = course_res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail=f"Program '{payload.program_code}' not found.")

    # Resolve active AY to scope the new section
    settings_result = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_result.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None

    sec_name = payload.name.strip()
    exist_res = await db.execute(
        select(Section).where(
            Section.course_id == course.id,
            Section.academic_year_id == active_ay_id,
            func.upper(Section.name) == sec_name.upper(),
        )
    )
    existing = exist_res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Section '{sec_name}' already exists for {course.code} in the active AY.")

    new_sec = Section(
        course_id=course.id,
        academic_year_id=active_ay_id,
        year_level=payload.year_level,
        name=sec_name,
        capacity=50,
    )
    db.add(new_sec)
    await db.commit()
    await db.refresh(new_sec)
    _bust_cache()
    return new_sec


@router.post("", response_model=CourseOut)
async def create_program(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    # Resolve org by code
    org_result = await db.execute(
        select(Organization).where(Organization.code == payload.org.upper())
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=400, detail=f"Organization '{payload.org}' not found.")

    course = Course(
        org_id=org.id,
        code=payload.code.strip().upper(),
        name=payload.name.strip(),
    )
    db.add(course)
    await db.flush()

    # Resolve active AY to scope auto-created sections
    settings_result = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_result.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None

    sec_count = max(1, payload.section_count or 1)
    secs_created = []
    created_secs = []
    for i in range(1, sec_count + 1):
        sec_name = f"1-{i}"
        secs_created.append(sec_name)
        sec = Section(
            course_id=course.id,
            academic_year_id=active_ay_id,
            year_level=1,
            name=sec_name,
            capacity=50,
        )
        db.add(sec)
        created_secs.append(sec)
    await db.commit()
    for s in created_secs:
        await db.refresh(s)

    sections_detail = [
        SectionItem(id=s.id, name=s.name, year_level=s.year_level)
        for s in created_secs
    ]

    _bust_cache()
    return CourseOut(
        id=course.id,
        org=org.code,
        code=course.code,
        name=course.name,
        section_count=sec_count,
        sections=secs_created,
        sections_detail=sections_detail,
    )


@router.put("/sections/{section_id}", response_model=SectionOut)
async def update_section(
    section_id: UUID,
    payload: SectionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Section).where(Section.id == section_id))
    sec = result.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found.")

    if payload.program_code:
        course_res = await db.execute(
            select(Course).where(func.upper(Course.code) == payload.program_code.strip().upper())
        )
        course = course_res.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail=f"Program '{payload.program_code}' not found.")
        sec.course_id = course.id

    if payload.year_level is not None:
        sec.year_level = payload.year_level

    if payload.name:
        new_name = payload.name.strip()
        exist_res = await db.execute(
            select(Section).where(
                Section.course_id == sec.course_id,
                Section.academic_year_id == sec.academic_year_id,
                Section.id != sec.id,
                func.upper(Section.name) == new_name.upper(),
            )
        )
        if exist_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Section '{new_name}' already exists for this program.")
        sec.name = new_name

    db.add(sec)
    await db.commit()
    await db.refresh(sec)
    _bust_cache()
    return sec


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: UUID,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Section).where(Section.id == section_id))
    sec = result.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found.")

    stud_count_res = await db.execute(
        select(func.count(Student.id)).where(Student.section_id == section_id, Student.deleted_at.is_(None))
    )
    stud_count = stud_count_res.scalar() or 0
    if stud_count > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete section '{sec.name}' because {stud_count} active student(s) are currently assigned to it."
        )

    await db.delete(sec)
    await db.commit()
    _bust_cache()
    return {"success": True, "id": str(section_id)}


@router.put("/{program_id}", response_model=CourseOut)
async def update_program(
    program_id: UUID,
    payload: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.organization), selectinload(Course.sections))
        .where(Course.id == program_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Program not found.")

    org_code = course.organization.code if course.organization else ""

    if payload.org:
        org_result = await db.execute(
            select(Organization).where(Organization.code == payload.org.upper())
        )
        org = org_result.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=400, detail=f"Organization '{payload.org}' not found.")
        course.org_id = org.id
        org_code = org.code

    if payload.code:
        course.code = payload.code.strip().upper()
    if payload.name:
        course.name = payload.name.strip()

    db.add(course)
    await db.flush()

    # Resolve active AY
    settings_result = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_result.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None

    # Manage sections if section_count is specified
    if payload.section_count is not None:
        target_count = max(1, payload.section_count)
        sec_query = select(Section).where(Section.course_id == course.id, Section.year_level == 1)
        if active_ay_id:
            sec_query = sec_query.where(Section.academic_year_id == active_ay_id)
        sec_res = await db.execute(sec_query.order_by(Section.name))
        curr_secs = sec_res.scalars().all()
        curr_count = len(curr_secs)

        if target_count > curr_count:
            for i in range(curr_count + 1, target_count + 1):
                sec_name = f"1-{i}"
                sec = Section(
                    course_id=course.id,
                    academic_year_id=active_ay_id,
                    year_level=1,
                    name=sec_name,
                    capacity=50,
                )
                db.add(sec)
        elif target_count < curr_count:
            # Safely prune from the end if no students are assigned
            for sec in reversed(curr_secs[target_count:]):
                stud_check = await db.execute(
                    select(Student.id).where(Student.section_id == sec.id).limit(1)
                )
                if not stud_check.scalar_one_or_none():
                    await db.delete(sec)
        await db.flush()

    await db.commit()

    # Re-fetch sections for active AY
    refetch_query = select(Section).where(Section.course_id == course.id)
    if active_ay_id:
        refetch_query = refetch_query.where(Section.academic_year_id == active_ay_id)
    refetched_secs = await db.execute(refetch_query)
    all_secs_obj = refetched_secs.scalars().all()
    sorted_secs = sorted(
        all_secs_obj,
        key=lambda s: [int(t) if t.isdigit() else t for t in s.name.replace('-', ' ').split()]
    )
    final_secs = [s.name for s in sorted_secs]

    sections_detail = [
        SectionItem(id=s.id, name=s.name, year_level=s.year_level)
        for s in sorted_secs
    ]

    _bust_cache()
    return CourseOut(
        id=course.id,
        org=org_code,
        code=course.code,
        name=course.name,
        section_count=len(final_secs),
        sections=final_secs,
        sections_detail=sections_detail,
    )


@router.delete("/{program_id}")
async def delete_program(
    program_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Course).where(Course.id == program_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Program not found.")

    await db.delete(course)
    await db.commit()
    _bust_cache()
    return {"success": True, "id": str(program_id)}
