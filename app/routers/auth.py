"""
app/routers/auth.py — Admin authentication endpoints
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
"""
from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
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
