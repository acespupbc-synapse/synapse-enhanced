import asyncio
import time
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.r2_storage import get_presigned_url, get_bucket_metrics
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.student import Student
from app.models.config import AcademicYear, Course, SystemSettings
from app.routers.students import get_live_visitor_count

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Phase 1.1: Allowlist for the media-proxy endpoint — only R2 presigned URLs allowed.
# This prevents SSRF attacks where an authenticated admin could pivot to internal services.
from app.core.config import get_settings as _get_settings_for_proxy
_proxy_settings = _get_settings_for_proxy()
ALLOWED_PROXY_PREFIXES: tuple[str, ...] = (
    f"https://{_proxy_settings.cf_account_id}.r2.cloudflarestorage.com/",
)

_db_size_cache = {"mb": 10.52, "ts": 0}


def bust_dashboard_cache():
    """Invalidate the dashboard cache so the next poll fetches fresh data."""
    _dashboard_cache["ts"] = 0



async def _get_db_storage_mb(db: AsyncSession) -> float:
    now = time.time()
    if now - _db_size_cache["ts"] > 300:
        try:
            db_size_res = await db.execute(select(func.pg_database_size(func.current_database())))
            size_bytes = db_size_res.scalar() or 0
            _db_size_cache["mb"] = round(size_bytes / (1024 * 1024), 2)
            _db_size_cache["ts"] = now
        except Exception:
            pass
    return _db_size_cache["mb"]



def _get_r2_storage_info(photo_count: int = 0, sig_count: int = 0) -> tuple[float, int]:
    """
    Thin wrapper around get_bucket_metrics() from r2_storage.py.
    Uses the shared module-level cache so /dashboard and /diagnostics always agree.
    IMPORTANT: This is a blocking function — always call via asyncio.to_thread().
    """
    metrics = get_bucket_metrics()
    return metrics["size_mb"], metrics["total_objects"]



try:
    import psutil
    psutil.cpu_percent(interval=None)  # Prime counter once at load
except Exception:
    psutil = None


def _get_cpu_percent() -> float:
    # Non-blocking instantaneous differential reading (0ms latency, zero thread sleep)
    try:
        if psutil:
            val = psutil.cpu_percent(interval=None)
            if val > 0.0:
                return round(val, 1)
        return 12.5
    except Exception:
        return 12.5


# Phase 3.4: Extend cache TTL from 2s to 10s to reduce DB load during 15s polling.
_dashboard_cache = {"data": None, "ts": 0}
_DASHBOARD_CACHE_TTL = 10.0  # seconds


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings_result = await db.execute(
        select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
    )
    system_settings = settings_result.scalar_one_or_none()
    active_ay_id = system_settings.active_ay_id if system_settings else None

    active_ay_name = "AY 2026-2027"
    registration_open = True
    if system_settings:
        registration_open = system_settings.registration_open
        if system_settings.active_ay:
            active_ay_name = f"AY {system_settings.active_ay.name}"

    # Filter all counts by active AY
    ay_filter = (Student.academic_year_id == active_ay_id) if active_ay_id else True

    counts_res = await db.execute(
        select(
            func.count(Student.id).filter(Student.deleted_at.is_(None), ay_filter),
            func.count(Student.id).filter(Student.deleted_at.is_not(None)),
        )
    )
    enrolled_count, recycle_count = counts_res.one()
    enrolled_count = enrolled_count or 0
    recycle_count = recycle_count or 0

    prog_res = await db.execute(
        select(Course.code, func.count(Student.id))
        .join(Student, Student.course_id == Course.id)
        .where(Student.deleted_at.is_(None), ay_filter)
        .group_by(Course.code)
    )
    prog_counts = {row[0]: row[1] for row in prog_res.all()}

    return {
        "isRegistrationOpen": registration_open,
        "enrolledCount": enrolled_count,
        "activeAcademicYear": active_ay_name,
        "dbStatus": "Online",
        "pendingReviewCount": 0,
        "recycleBinCount": recycle_count,
        "programCounts": prog_counts,
        "cpuPercent": _get_cpu_percent(),
        "liveUsers": get_live_visitor_count(),
    }


@router.get("/capacity")
async def get_capacity(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    counts_res = await db.execute(
        select(
            func.count(Student.id).filter(Student.deleted_at.is_(None)),
            func.count(Student.photo_r2_key).filter(Student.deleted_at.is_(None)),
            func.count(Student.signature_r2_key).filter(Student.deleted_at.is_(None)),
        )
    )
    enrolled, photo_count, sig_count = counts_res.one()
    used = enrolled or 0
    max_records = 500
    storage_max_mb = 500

    storage_mb = await _get_db_storage_mb(db)
    pct = round((storage_mb / storage_max_mb) * 100, 2)

    # Off-load blocking boto3 paginator to thread pool so the event loop stays responsive
    r2_used_mb, total_files = await asyncio.to_thread(_get_r2_storage_info, photo_count, sig_count)
    r2_max_mb = 10000.0  # 10 GB free tier
    r2_pct = round((r2_used_mb / r2_max_mb) * 100, 2)

    return {
        "supabase": {
            "usedRecords": used,
            "maxRecords": max_records,
            "percentage": pct,
            "storageUsedMb": storage_mb,
            "storageMaxMb": storage_max_mb,
        },
        "cloudflare": {
            "usedFiles": total_files,
            "maxFiles": 10000,
            "percentage": r2_pct,
            "storageUsedMb": r2_used_mb,
            "storageMaxMb": r2_max_mb,
        },
        "usedRecords": used,
        "maxRecords": max_records,
        "percentage": pct,
        "storageUsedMb": storage_mb,
        "storageMaxMb": storage_max_mb,
    }


@router.get("/dashboard")
async def get_full_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    now = time.time()
    if _dashboard_cache["data"] and (now - _dashboard_cache["ts"] < _DASHBOARD_CACHE_TTL):
        cached = _dashboard_cache["data"].copy()
        if "stats" in cached:
            cached["stats"] = {**cached["stats"], "liveUsers": get_live_visitor_count()}
        return cached

    settings_result = await db.execute(
        select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
    )
    system_settings = settings_result.scalar_one_or_none()
    active_ay_id = system_settings.active_ay_id if system_settings else None
    active_ay_name = "AY 2026-2027"
    registration_open = True
    if system_settings:
        registration_open = system_settings.registration_open
        if system_settings.active_ay:
            active_ay_name = f"AY {system_settings.active_ay.name}"

    # Filter all student counts and lists by active AY
    ay_filter = (Student.academic_year_id == active_ay_id) if active_ay_id else True

    counts_res = await db.execute(
        select(
            func.count(Student.id).filter(Student.deleted_at.is_(None), ay_filter),
            func.count(Student.id).filter(Student.deleted_at.is_not(None)),
            func.count(Student.photo_r2_key).filter(Student.deleted_at.is_(None), ay_filter),
            func.count(Student.signature_r2_key).filter(Student.deleted_at.is_(None), ay_filter),
        )
    )
    enrolled_count, recycle_count, photo_count, sig_count = counts_res.one()
    enrolled_count = enrolled_count or 0
    recycle_count = recycle_count or 0

    prog_res = await db.execute(
        select(Course.code, func.count(Student.id))
        .join(Student, Student.course_id == Course.id)
        .where(Student.deleted_at.is_(None), ay_filter)
        .group_by(Course.code)
    )
    prog_counts = {row[0]: row[1] for row in prog_res.all()}

    storage_mb = await _get_db_storage_mb(db)

    # Cloudflare R2 Media Capacity — off-load blocking boto3 paginator to thread pool
    r2_used_mb, total_files = await asyncio.to_thread(_get_r2_storage_info, photo_count, sig_count)
    r2_max_mb = 10000.0  # 10 GB free tier
    r2_pct = round((r2_used_mb / r2_max_mb) * 100, 2)

    stats = {
        "isRegistrationOpen": registration_open,
        "enrolledCount": enrolled_count,
        "activeAcademicYear": active_ay_name,
        "dbStatus": "Online",
        "pendingReviewCount": 0,
        "recycleBinCount": recycle_count,
        "programCounts": prog_counts,
        "cpuPercent": _get_cpu_percent(),
        "liveUsers": get_live_visitor_count(),
    }

    capacity = {
        "supabase": {
            "usedRecords": enrolled_count,
            "maxRecords": 500,
            "percentage": round((storage_mb / 500) * 100, 2),
            "storageUsedMb": storage_mb,
            "storageMaxMb": 500,
        },
        "cloudflare": {
            "usedFiles": total_files,
            "maxFiles": 10000,
            "percentage": r2_pct,
            "storageUsedMb": r2_used_mb,
            "storageMaxMb": r2_max_mb,
        },
        # Flat fallback
        "usedRecords": enrolled_count,
        "maxRecords": 500,
        "percentage": round((storage_mb / 500) * 100, 2),
        "storageUsedMb": storage_mb,
        "storageMaxMb": 500,
    }

    feed = await get_live_feed(db, _admin)

    data = {
        "stats": stats,
        "capacity": capacity,
        "feed": feed,
    }
    _dashboard_cache["data"] = data
    _dashboard_cache["ts"] = now
    return data


@router.get("/feed")
async def get_live_feed(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    # Resolve active AY for filtering
    settings_res = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_res.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None
    ay_filter = (Student.academic_year_id == active_ay_id) if active_ay_id else True

    result = await db.execute(
        select(Student)
        .options(selectinload(Student.course), selectinload(Student.section))
        .where(Student.deleted_at.is_(None), ay_filter)
        .order_by(
            func.coalesce(Student.updated_at, Student.created_at).desc(),
            Student.created_at.desc()
        )
        .limit(10)
    )
    students = result.scalars().all()

    feed = []
    for s in students:
        course_code = s.course.code if s.course else "—"
        section_name = s.section.name if s.section else "—"
        ts = s.updated_at or s.created_at
        feed.append({
            "id": str(s.id),
            "student_number": s.student_number,
            "name": f"{s.last_name}, {s.first_name} {(s.middle_name or '')[:1]}{'.' if s.middle_name else ''}".strip(),
            "course": course_code,
            "section": section_name,
            "time": ts.isoformat() if ts else "",
            "photo_url": get_presigned_url(s.photo_r2_key),
        })

    return feed


@router.get("/media-proxy")
async def media_proxy(
    url: str,
    _admin: AdminUser = Depends(get_current_admin),
):
    """Proxy private R2 media for canvas-taint-free cropping in the admin panel.

    Phase 1.1 (SSRF fix): Only R2 presigned URLs matching the configured account
    are allowed. Any other URL returns 400.
    Phase 3.5: Blocking urllib.request is now run in a thread pool to avoid
    blocking the async event loop.
    """
    # SSRF allowlist check
    if not any(url.startswith(prefix) for prefix in ALLOWED_PROXY_PREFIXES):
        raise HTTPException(
            status_code=400,
            detail="URL not allowed. Only presigned R2 URLs for this account are accepted."
        )

    def _fetch() -> tuple[bytes, str]:
        req = urllib.request.Request(url, headers={"User-Agent": "ACES-Synapse/2.2"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read(), resp.headers.get("Content-Type", "image/jpeg")

    try:
        # Phase 3.5: Off-load blocking I/O to thread pool
        content, content_type = await asyncio.to_thread(_fetch)
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Proxy error: {str(e)}")
