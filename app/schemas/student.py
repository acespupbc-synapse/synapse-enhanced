"""
app/schemas/student.py — Pydantic schemas for student registration and management
"""
import re
from datetime import date, datetime
from typing import Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# Allow letters (including accented/Filipino chars like Ññ), spaces, hyphens, periods, apostrophes.
_NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s\-\'\.]+$")


def _sanitize_and_validate_name(v: Optional[str], field_label: str) -> Optional[str]:
    if v is None:
        return None
    cleaned = v.strip()
    if not cleaned:
        return cleaned
    if not _NAME_REGEX.match(cleaned):
        raise ValueError(
            f"{field_label} contains invalid characters. Only letters, spaces, hyphens, periods, and apostrophes are allowed."
        )
    return cleaned.upper()


def _validate_phone_digits(v: Optional[str], field_label: str) -> Optional[str]:
    if v is None:
        return None
    digits = re.sub(r"\D", "", v)
    if len(digits) < 10 or len(digits) > 15:
        raise ValueError(f"{field_label} must contain between 10 and 15 digits.")
    return digits


# ── Registration (public endpoint) ────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    student_number: str = Field(..., min_length=1, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[Literal["Male", "Female", "Other"]] = "Male"
    birthdate: date
    email: EmailStr
    organization: Optional[str] = Field(default=None, max_length=50)

    # Academic info — resolved to IDs server-side
    course: str = Field(..., min_length=1, max_length=50)   # course code e.g. "BSCpE"
    year_level: str = Field(..., min_length=1, max_length=20)  # e.g. "1st Year"
    section: str = Field(..., min_length=1, max_length=20)   # e.g. "1-1"

    # Personal address
    residential_address: str = Field(..., min_length=1, max_length=500)

    # Emergency contact
    emergency_contact_name: str = Field(..., min_length=1, max_length=150)
    emergency_contact_number: str = Field(..., min_length=10, max_length=20)
    emergency_address: str = Field(..., min_length=1, max_length=500)

    # Media (base64 DataURLs)
    photo_data: Optional[str] = None       # data:image/jpeg;base64,...
    signature_data: Optional[str] = None   # data:image/jpeg;base64,...

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, v: str) -> str:
        return _sanitize_and_validate_name(v, "First name")

    @field_validator("middle_name")
    @classmethod
    def validate_middle_name(cls, v: Optional[str]) -> Optional[str]:
        return _sanitize_and_validate_name(v, "Middle name")

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        return _sanitize_and_validate_name(v, "Last name")

    @field_validator("emergency_contact_name")
    @classmethod
    def validate_emergency_contact_name(cls, v: str) -> str:
        return _sanitize_and_validate_name(v, "Emergency contact name")

    @field_validator("emergency_contact_number")
    @classmethod
    def validate_emergency_contact_number(cls, v: str) -> str:
        return _validate_phone_digits(v, "Emergency contact number")


# ── Admin edit ────────────────────────────────────────────────────────────────

class StudentUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    student_number: Optional[str] = Field(default=None, max_length=30)
    course_code: Optional[str] = Field(default=None, max_length=50)
    section_name: Optional[str] = Field(default=None, max_length=50)
    year_level: Optional[int] = None
    gender: Optional[Literal["Male", "Female", "Other"]] = None
    birth_date: Optional[Union[date, str]] = None
    email: Optional[EmailStr] = None
    perm_strt: Optional[str] = Field(default=None, max_length=500)
    perm_bldg: Optional[str] = Field(default=None, max_length=200)
    perm_dstr: Optional[str] = Field(default=None, max_length=200)
    perm_city: Optional[str] = Field(default=None, max_length=200)
    perm_stad: Optional[str] = Field(default=None, max_length=200)
    perm_ctry: Optional[str] = Field(default=None, max_length=100)
    perm_post: Optional[str] = Field(default=None, max_length=20)
    contact_person_name: Optional[str] = Field(default=None, max_length=150)
    contact_person_number: Optional[str] = Field(default=None, max_length=20)
    contact_person_number2: Optional[str] = Field(default=None, max_length=20)
    contact_person_number3: Optional[str] = Field(default=None, max_length=20)
    contact_strt: Optional[str] = Field(default=None, max_length=500)
    contact_bldg: Optional[str] = Field(default=None, max_length=200)
    contact_dstr: Optional[str] = Field(default=None, max_length=200)
    contact_city: Optional[str] = Field(default=None, max_length=200)
    contact_stad: Optional[str] = Field(default=None, max_length=200)
    contact_ctry: Optional[str] = Field(default=None, max_length=100)
    contact_post: Optional[str] = Field(default=None, max_length=20)
    status: Optional[str] = Field(default=None, max_length=50)
    photo_data: Optional[str] = None
    signature_data: Optional[str] = None

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, v: Optional[str]) -> Optional[str]:
        return _sanitize_and_validate_name(v, "First name")

    @field_validator("middle_name")
    @classmethod
    def validate_middle_name(cls, v: Optional[str]) -> Optional[str]:
        return _sanitize_and_validate_name(v, "Middle name")

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: Optional[str]) -> Optional[str]:
        return _sanitize_and_validate_name(v, "Last name")

    @field_validator("contact_person_name")
    @classmethod
    def validate_contact_person_name(cls, v: Optional[str]) -> Optional[str]:
        return _sanitize_and_validate_name(v, "Contact person name")

    @field_validator("contact_person_number")
    @classmethod
    def validate_contact_person_number(cls, v: Optional[str]) -> Optional[str]:
        return _validate_phone_digits(v, "Contact person number")


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
    status: Optional[str] = None
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
