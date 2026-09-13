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
from app.models.config import Course, Organization
from app.schemas.programs import CourseCreate, CourseOut, CourseUpdate

router = APIRouter(prefix="/api/admin/programs", tags=["programs"])


@router.get("", response_model=list[CourseOut])
async def list_programs(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Course).options(selectinload(Course.organization)).order_by(Course.code)
    )
    courses = result.scalars().all()
    return [
        CourseOut(id=c.id, org=c.organization.code if c.organization else "", code=c.code, name=c.name)
        for c in courses
    ]


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

    return CourseOut(id=course.id, org=org.code, code=course.code, name=course.name)


@router.put("/{program_id}", response_model=CourseOut)
async def update_program(
    program_id: UUID,
    payload: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Course).options(selectinload(Course.organization)).where(Course.id == program_id)
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
    return CourseOut(id=course.id, org=org_code, code=course.code, name=course.name)


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
