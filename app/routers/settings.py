"""
app/routers/settings.py — System settings and academic year management

GET    /api/admin/settings
PUT    /api/admin/settings
POST   /api/admin/settings/toggle-registration
GET    /api/admin/settings/academic-years
POST   /api/admin/settings/academic-years
DELETE /api/admin/settings/academic-years/{id}
"""
import asyncio
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings as get_app_settings
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, SystemSettings
from app.models.student import Student
from app.schemas.settings import (
    AcademicYearCreate,
    AcademicYearOut,
    SettingsOut,
    SettingsUpdateRequest,
    ToggleRegistrationRequest,
)


def _get_masked_db_host() -> str:
    """Derive masked database host from config without hardcoding or leaking credentials."""
    try:
        cfg = get_app_settings()
        parsed = urlsplit(cfg.database_url)
        host = parsed.hostname or "localhost"
        port = f":{parsed.port}" if parsed.port else ""
        path = parsed.path or "/postgres"
        return f"{host}{port}{path}"
    except Exception:
        return "configured-database-host"

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
    payload: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    reg_open = payload.get_registration_open()
    if reg_open is not None:
        settings.registration_open = reg_open

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

        # Verify whether the newly activated AY has sections defined; if 0, auto-clone from existing
        from app.models.config import Section
        cur_secs_res = await db.execute(select(func.count(Section.id)).where(Section.academic_year_id == ay.id))
        cur_sec_count = cur_secs_res.scalar() or 0
        if cur_sec_count == 0:
            donor_secs_res = await db.execute(
                select(Section).where(Section.academic_year_id.isnot(None), Section.academic_year_id != ay.id)
            )
            donor_secs = donor_secs_res.scalars().all()
            if donor_secs:
                seen_course_names = set()
                for ds in donor_secs:
                    key = (ds.course_id, ds.name.strip().upper())
                    if key not in seen_course_names:
                        seen_course_names.add(key)
                        db.add(
                            Section(
                                course_id=ds.course_id,
                                academic_year_id=ay.id,
                                year_level=ds.year_level,
                                name=ds.name,
                                capacity=ds.capacity,
                            )
                        )
                await db.flush()

    db.add(settings)
    await db.flush()

    # Bust dashboard and programs cache so all clients see updated AY & sections immediately
    try:
        from app.routers.admin import bust_dashboard_cache
        bust_dashboard_cache()
    except Exception:
        pass

    try:
        from app.routers.programs import bust_programs_cache
        bust_programs_cache()
    except Exception:
        pass

    return {"success": True, "registration_open": settings.registration_open, "active_ay": payload.active_ay}


from app.core.r2_storage import get_bucket_metrics

@router.get("/diagnostics")
async def get_diagnostics(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = await _get_or_create_settings(db)
    ay_name = settings.active_ay.name if settings.active_ay else "2026-2027"

    stud_count_res = await db.execute(
        select(func.count(Student.id)).where(Student.deleted_at.is_(None))
    )
    stud_count = stud_count_res.scalar() or 0

    recycled_count_res = await db.execute(
        select(func.count(Student.id)).where(Student.deleted_at.isnot(None))
    )
    recycled_count = recycled_count_res.scalar() or 0

    photo_count_res = await db.execute(
        select(func.count(Student.id)).where(
            Student.photo_r2_key.isnot(None),
            Student.deleted_at.is_(None),
        )
    )
    photo_count = photo_count_res.scalar() or 0

    sig_count_res = await db.execute(
        select(func.count(Student.id)).where(
            Student.signature_r2_key.isnot(None),
            Student.deleted_at.is_(None),
        )
    )
    sig_count = sig_count_res.scalar() or 0

    # Supabase PostgreSQL database size in MB
    db_size_mb = 0.0
    try:
        db_size_res = await db.execute(select(func.pg_database_size(func.current_database())))
        db_size_bytes = db_size_res.scalar() or 0
        db_size_mb = round(db_size_bytes / (1024 * 1024), 2)
    except Exception as exc:
        print(f"[WARN] Failed to query pg_database_size: {exc}")

    # Cloudflare R2 bucket live metrics (offloaded to thread)
    r2_stats = await asyncio.to_thread(get_bucket_metrics)

    return {
        "dbEngine": "PostgreSQL 15+ (Supabase Pooler) + SQLAlchemy 2.0 Async",
        "dbHost": _get_masked_db_host(),
        "alembicRevision": "001_canonical_postgresql_schema",
        "cloudStorage": "Cloudflare R2 (synapse-media)",
        "apiStatus": "Healthy (Online)",
        "activeAcademicYear": ay_name,
        "totalRegistered": stud_count,
        "activeStudents": stud_count,
        "recycleBinCount": recycled_count,
        "totalPhotos": photo_count,
        "totalSignatures": sig_count,
        "supabaseStorageMb": db_size_mb,
        "r2StorageMb": r2_stats.get("size_mb", 0.0),
        "r2TotalObjects": r2_stats.get("total_objects", 0),
        "r2TotalBytes": r2_stats.get("total_bytes", 0),
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

    # Clone sections from existing populated AY to the newly created AY
    from app.models.config import Section, SystemSettings
    settings_res = await db.execute(select(SystemSettings))
    settings_obj = settings_res.scalars().first()
    active_ay_id = settings_obj.active_ay_id if settings_obj else None

    donor_secs = []
    if active_ay_id:
        donor_secs_res = await db.execute(
            select(Section).where(Section.academic_year_id == active_ay_id)
        )
        donor_secs = donor_secs_res.scalars().all()

    if not donor_secs:
        donor_secs_res = await db.execute(
            select(Section).where(Section.academic_year_id.isnot(None), Section.academic_year_id != ay.id)
        )
        donor_secs = donor_secs_res.scalars().all()

    if donor_secs:
        seen_course_sec = set()
        for ds in donor_secs:
            key = (ds.course_id, ds.name.strip().upper())
            if key in seen_course_sec:
                continue
            seen_course_sec.add(key)
            db.add(
                Section(
                    course_id=ds.course_id,
                    academic_year_id=ay.id,
                    year_level=ds.year_level,
                    name=ds.name,
                    capacity=ds.capacity,
                )
            )
        await db.flush()

    try:
        from app.routers.programs import bust_programs_cache
        bust_programs_cache()
    except Exception:
        pass

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
