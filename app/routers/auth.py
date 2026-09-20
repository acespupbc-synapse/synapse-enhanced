"""
app/routers/auth.py — Admin authentication endpoints
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
"""
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin,
)
from app.models.admin_user import AdminUser
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    AdminUserOut,
    ChangePasswordRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Phase 1.2: In-process login rate limiter.
# Tracks {ip: [attempt_timestamp, ...]} with a 60-second sliding window.
# Max 10 attempts per IP per 60 seconds. For multi-worker deployments, replace
# with a Redis-backed solution (e.g., slowapi + Redis).
_login_attempts: dict[str, list[float]] = defaultdict(list)
_LOGIN_MAX_ATTEMPTS = 10
_LOGIN_WINDOW_SECONDS = 60


def _check_login_rate_limit(client_ip: str) -> None:
    """Raise 429 if the IP has exceeded the login rate limit."""
    now = time.time()
    window_start = now - _LOGIN_WINDOW_SECONDS
    # Prune attempts outside the sliding window
    attempts = [t for t in _login_attempts[client_ip] if t > window_start]
    _login_attempts[client_ip] = attempts
    if len(attempts) >= _LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please wait {_LOGIN_WINDOW_SECONDS} seconds.",
            headers={"Retry-After": str(_LOGIN_WINDOW_SECONDS)},
        )
    _login_attempts[client_ip].append(now)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Phase 1.2: Rate limit by client IP before any DB query
    client_ip = request.client.host if request.client else "unknown"
    _check_login_rate_limit(client_ip)

    result = await db.execute(
        select(AdminUser).where(AdminUser.username == payload.username, AdminUser.is_active == True)
    )
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token(data={"sub": str(admin.id)})
    return TokenResponse(
        token=token,
        user=AdminUserOut(
            id=admin.id,
            username=admin.username,
            email=admin.email,
        ),
    )


@router.post("/logout")
async def logout():
    # Token invalidation is client-side (remove from localStorage).
    # Stateless JWT — no server-side token blacklist in Phase 1.
    return {"success": True, "message": "Logged out."}


@router.get("/me", response_model=AdminUserOut)
async def get_me(current_admin: AdminUser = Depends(get_current_admin)):
    return AdminUserOut(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
    )


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    current_admin.password_hash = hash_password(payload.new_password)
    db.add(current_admin)
    return {"success": True, "message": "Password updated successfully."}
