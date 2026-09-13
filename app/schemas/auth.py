"""
app/schemas/auth.py — Pydantic schemas for authentication endpoints
"""
from pydantic import BaseModel, Field
from uuid import UUID


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: "AdminUserOut"


class AdminUserOut(BaseModel):
    id: UUID
    username: str
    email: str | None
    role: str = "superadmin"
    name: str = "ACES Administrator"

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


TokenResponse.model_rebuild()
