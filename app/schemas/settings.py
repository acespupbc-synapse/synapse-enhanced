"""
app/schemas/settings.py — Pydantic schemas for system settings endpoints
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ToggleRegistrationRequest(BaseModel):
    is_open: bool


class SettingsOut(BaseModel):
    registration_open: bool
    active_ay: Optional[str] = None   # academic year name string

    model_config = {"from_attributes": True}


class AcademicYearCreate(BaseModel):
    name: str  # e.g. "2025-2026"


class AcademicYearOut(BaseModel):
    id: UUID
    name: str
    is_active: bool
    model_config = {"from_attributes": True}
