"""
app/routers/programs.py — Academic programs CRUD endpoints

GET    /api/admin/programs
POST   /api/admin/programs
PUT    /api/admin/programs/{id}
DELETE /api/admin/programs/{id}
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import Course, Organization, Section
from app.models.student import Student
from app.schemas.programs import CourseCreate, CourseOut, CourseUpdate

router = APIRouter(prefix="/api/admin/programs", tags=["programs"])


@router.get("", response_model=list[CourseOut])
async def list_programs(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.organization), selectinload(Course.sections))
        .order_by(Course.code)
    )
    courses = result.scalars().all()
    out = []
    for c in courses:
        yr1_secs = sorted([s.name for s in c.sections if s.year_level == 1])
        if not yr1_secs:
            yr1_secs = ["1-1"]
        out.append(
            CourseOut(
                id=c.id,
                org=c.organization.code if c.organization else "",
                code=c.code,
                name=c.name,
                section_count=len(yr1_secs),
                sections=yr1_secs,
            )
        )
    return out


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

    sec_count = max(1, payload.section_count or 1)
    secs_created = []
    for i in range(1, sec_count + 1):
        sec_name = f"1-{i}"
        secs_created.append(sec_name)
        sec = Section(
            course_id=course.id,
            year_level=1,
            name=sec_name,
            capacity=50,
        )
        db.add(sec)
    await db.flush()

    return CourseOut(
        id=course.id,
        org=org.code,
        code=course.code,
        name=course.name,
        section_count=sec_count,
        sections=secs_created,
    )


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

    # Manage sections if section_count is specified
    if payload.section_count is not None:
        target_count = max(1, payload.section_count)
        sec_res = await db.execute(
            select(Section)
            .where(Section.course_id == course.id, Section.year_level == 1)
            .order_by(Section.name)
        )
        curr_secs = sec_res.scalars().all()
        curr_count = len(curr_secs)

        if target_count > curr_count:
            for i in range(curr_count + 1, target_count + 1):
                sec_name = f"1-{i}"
                sec = Section(
                    course_id=course.id,
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

    # Re-fetch sections
    refetched_secs = await db.execute(
        select(Section.name)
        .where(Section.course_id == course.id, Section.year_level == 1)
        .order_by(Section.name)
    )
    final_secs = refetched_secs.scalars().all()
    if not final_secs:
        final_secs = ["1-1"]

    return CourseOut(
        id=course.id,
        org=org_code,
        code=course.code,
        name=course.name,
        section_count=len(final_secs),
        sections=list(final_secs),
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
    return {"success": True, "id": str(program_id)}
