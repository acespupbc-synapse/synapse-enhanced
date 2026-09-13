"""
app/routers/settings.py — System settings and academic year management

GET    /api/admin/settings
PUT    /api/admin/settings
POST   /api/admin/settings/toggle-registration
GET    /api/admin/settings/academic-years
POST   /api/admin/settings/academic-years
DELETE /api/admin/settings/academic-years/{id}
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, SystemSettings
from app.schemas.settings import (
    AcademicYearCreate,
    AcademicYearOut,
    SettingsOut,
    ToggleRegistrationRequest,
)

router = APIRouter(prefix="/api/admin/settings", tags=["settings"])


async def _get_or_create_settings(db: AsyncSession) -> SystemSettings:
    result = await db.execute(
        select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SystemSettings(registration_open=True)
        db.add(settings)
        await db.flush()
    return settings


@router.get("", response_model=SettingsOut)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    ay_name = None
    if settings.active_ay:
        ay_name = settings.active_ay.name
    return SettingsOut(registration_open=settings.registration_open, active_ay=ay_name)


@router.put("")
async def update_settings(
    payload: SettingsOut,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    settings.registration_open = payload.registration_open
    db.add(settings)
    return {"success": True}


@router.post("/toggle-registration")
async def toggle_registration(
    payload: ToggleRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    settings.registration_open = payload.is_open
    db.add(settings)
    return {"success": True, "is_open": payload.is_open}


@router.get("/academic-years", response_model=list[AcademicYearOut])
async def list_academic_years(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(AcademicYear).order_by(AcademicYear.name.desc()))
    return result.scalars().all()


@router.post("/academic-years", response_model=AcademicYearOut)
async def create_academic_year(
    payload: AcademicYearCreate,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    existing = await db.execute(select(AcademicYear).where(AcademicYear.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Academic year '{payload.name}' already exists.")

    ay = AcademicYear(name=payload.name)
    db.add(ay)
    await db.flush()
    return ay


@router.delete("/academic-years/{ay_id}")
async def delete_academic_year(
    ay_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(AcademicYear).where(AcademicYear.id == ay_id))
    ay = result.scalar_one_or_none()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic year not found.")
    await db.delete(ay)
    return {"success": True}
