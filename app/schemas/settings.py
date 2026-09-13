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


class SettingsUpdateRequest(BaseModel):
    registration_open: Optional[bool] = None
    is_registration_open: Optional[bool] = None
    active_ay: Optional[str] = None
    allowed_year_levels: Optional[str] = None
    require_photo: Optional[bool] = None
    admin_email: Optional[str] = None

    def get_registration_open(self) -> Optional[bool]:
        if self.registration_open is not None:
            return self.registration_open
        return self.is_registration_open


class AcademicYearCreate(BaseModel):
    name: str  # e.g. "2025-2026"


class AcademicYearOut(BaseModel):
    id: UUID
    name: str
    is_active: bool
    model_config = {"from_attributes": True}
