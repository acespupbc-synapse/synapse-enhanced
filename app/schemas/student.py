"""
app/schemas/student.py — Pydantic schemas for student registration and management
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Registration (public endpoint) ────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    student_number: str = Field(..., min_length=1, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = "Male"
    birthdate: date
    email: str = Field(..., min_length=1)
    organization: Optional[str] = None

    # Academic info — resolved to IDs server-side
    course: str  # course code e.g. "BSCpE"
    year_level: str  # e.g. "1st Year"
    section: str  # e.g. "1-1"

    # Personal address
    residential_address: str = Field(..., min_length=1)

    # Emergency contact
    emergency_contact_name: str = Field(..., min_length=1)
    emergency_contact_number: str = Field(..., min_length=1)
    emergency_address: str = Field(..., min_length=1)

    # Media (base64 DataURLs)
    photo_data: Optional[str] = None       # data:image/jpeg;base64,...
    signature_data: Optional[str] = None   # data:image/jpeg;base64,...


# ── Admin edit ────────────────────────────────────────────────────────────────

class StudentUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    email: Optional[str] = None
    perm_strt: Optional[str] = None
    perm_bldg: Optional[str] = None
    perm_dstr: Optional[str] = None
    perm_city: Optional[str] = None
    perm_stad: Optional[str] = None
    perm_ctry: Optional[str] = None
    perm_post: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_number: Optional[str] = None
    contact_person_number2: Optional[str] = None
    contact_person_number3: Optional[str] = None
    contact_strt: Optional[str] = None
    contact_bldg: Optional[str] = None
    contact_dstr: Optional[str] = None
    contact_city: Optional[str] = None
    contact_stad: Optional[str] = None
    contact_ctry: Optional[str] = None
    contact_post: Optional[str] = None
    status: Optional[str] = None


# ── Media upload ──────────────────────────────────────────────────────────────

class PhotoUploadRequest(BaseModel):
    photo: str  # base64 DataURL


class SignatureUploadRequest(BaseModel):
    signature: str  # base64 DataURL


# ── Response ──────────────────────────────────────────────────────────────────

class StudentOut(BaseModel):
    id: UUID
    student_number: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    email: str
    status: str
    organization: Optional[str] = None

    # Academic
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    section_name: Optional[str] = None
    year_level: Optional[int] = None
    academic_year: Optional[str] = None

    # Address
    perm_strt: Optional[str] = None
    perm_bldg: Optional[str] = None
    perm_dstr: Optional[str] = None
    perm_city: Optional[str] = None
    perm_stad: Optional[str] = None
    perm_ctry: Optional[str] = None
    perm_post: Optional[str] = None

    # Emergency contact
    contact_person_name: Optional[str] = None
    contact_person_number: Optional[str] = None
    contact_person_number2: Optional[str] = None
    contact_person_number3: Optional[str] = None
    contact_strt: Optional[str] = None
    contact_bldg: Optional[str] = None
    contact_dstr: Optional[str] = None
    contact_city: Optional[str] = None
    contact_stad: Optional[str] = None
    contact_ctry: Optional[str] = None
    contact_post: Optional[str] = None

    # Media (presigned URLs — generated at response time)
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    success: bool = True
    registration_id: str
    student_number: str
    message: str
