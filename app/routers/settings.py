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
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, SystemSettings
from app.models.student import Student
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
    ay_name = "2026-2027"
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

    if payload.active_ay:
        clean_ay = payload.active_ay.replace("AY", "").strip()
        ay_res = await db.execute(select(AcademicYear).where(AcademicYear.name == clean_ay))
        ay = ay_res.scalar_one_or_none()
        if not ay:
            ay = AcademicYear(name=clean_ay, is_active=True)
            db.add(ay)
            await db.flush()

        all_ays = await db.execute(select(AcademicYear))
        for item in all_ays.scalars().all():
            item.is_active = (item.id == ay.id)
            db.add(item)

        settings.active_ay_id = ay.id

    db.add(settings)
    await db.flush()
    return {"success": True, "registration_open": settings.registration_open, "active_ay": payload.active_ay}


@router.get("/diagnostics")
async def get_diagnostics(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    ay_name = settings.active_ay.name if settings.active_ay else "2026-2027"

    stud_count_res = await db.execute(select(func.count(Student.id)))
    stud_count = stud_count_res.scalar() or 0

    photo_count_res = await db.execute(
        select(func.count(Student.id)).where(Student.photo_r2_key.isnot(None))
    )
    photo_count = photo_count_res.scalar() or 0

    sig_count_res = await db.execute(
        select(func.count(Student.id)).where(Student.signature_r2_key.isnot(None))
    )
    sig_count = sig_count_res.scalar() or 0

    return {
        "dbEngine": "PostgreSQL 15+ (Supabase Pooler) + SQLAlchemy 2.0 Async",
        "dbHost": "aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
        "alembicRevision": "001_canonical_postgresql_schema",
        "cloudStorage": "Cloudflare R2 (synapse-media)",
        "apiStatus": "Healthy (Online)",
        "activeAcademicYear": ay_name,
        "totalRegistered": stud_count,
        "totalPhotos": photo_count,
        "totalSignatures": sig_count,
    }


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
