"""
app/routers/admin.py — Dashboard stats, capacity, and live feed endpoints
GET /api/admin/stats
GET /api/admin/capacity
GET /api/admin/feed
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.r2_storage import get_presigned_url
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.student import Student, RegistrationStatus
from app.models.config import AcademicYear, SystemSettings

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    # Active student count
    enrolled = await db.execute(
        select(func.count(Student.id)).where(Student.deleted_at.is_(None))
    )
    enrolled_count = enrolled.scalar_one() or 0

    # Active academic year
    settings_result = await db.execute(
        select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
    )
    system_settings = settings_result.scalar_one_or_none()

    active_ay_name = "AY 2025-2026"
    registration_open = True
    if system_settings:
        registration_open = system_settings.registration_open
        if system_settings.active_ay:
            active_ay_name = f"AY {system_settings.active_ay.name}"

    # Pending review count
    pending = await db.execute(
        select(func.count(Student.id)).where(
            Student.deleted_at.is_(None),
            Student.status == RegistrationStatus.PENDING,
        )
    )
    pending_count = pending.scalar_one() or 0

    # Recycle bin count
    recycled = await db.execute(
        select(func.count(Student.id)).where(Student.deleted_at.is_not(None))
    )
    recycle_count = recycled.scalar_one() or 0

    # Program breakdown
    from app.models.config import Course
    prog_res = await db.execute(
        select(Course.code, func.count(Student.id))
        .join(Student, Student.course_id == Course.id)
        .where(Student.deleted_at.is_(None))
        .group_by(Course.code)
    )
    prog_counts = {row[0]: row[1] for row in prog_res.all()}

    return {
        "isRegistrationOpen": registration_open,
        "enrolledCount": enrolled_count,
        "activeAcademicYear": active_ay_name,
        "dbStatus": "Online",
        "pendingReviewCount": pending_count,
        "recycleBinCount": recycle_count,
        "programCounts": prog_counts,
    }


@router.get("/capacity")
async def get_capacity(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    enrolled = await db.execute(
        select(func.count(Student.id)).where(Student.deleted_at.is_(None))
    )
    used = enrolled.scalar_one() or 0
    max_records = 500
    storage_mb = round(4.5 + (used * 0.05), 1)

    return {
        "usedRecords": used,
        "maxRecords": max_records,
        "percentage": round((used / max_records) * 100, 1),
        "storageUsedMb": storage_mb,
        "storageMaxMb": 500,
    }


@router.get("/feed")
async def get_live_feed(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.course), selectinload(Student.section))
        .where(Student.deleted_at.is_(None))
        .order_by(Student.created_at.desc())
        .limit(10)
    )
    students = result.scalars().all()

    feed = []
    for s in students:
        course_code = s.course.code if s.course else "—"
        section_name = s.section.name if s.section else "—"
        created = s.created_at
        feed.append({
            "id": str(s.id),
            "student_number": s.student_number,
            "name": f"{s.last_name}, {s.first_name} {(s.middle_name or '')[:1]}{'.' if s.middle_name else ''}".strip(),
            "course": course_code,
            "section": section_name,
            "time": created.isoformat() if created else "",
            "photo_url": get_presigned_url(s.photo_r2_key),
        })

    return feed
