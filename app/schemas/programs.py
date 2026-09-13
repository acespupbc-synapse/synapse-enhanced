"""
app/schemas/programs.py — Pydantic schemas for academic programs management
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class OrganizationOut(BaseModel):
    id: UUID
    code: str
    name: str
    theme_color: Optional[str] = None
    logo_url: Optional[str] = None
    model_config = {"from_attributes": True}


class CourseCreate(BaseModel):
    org: str = Field(..., description="Organization code e.g. ACES")
    code: str = Field(..., min_length=1, max_length=30)
    name: str = Field(..., min_length=1, max_length=255)


class CourseUpdate(BaseModel):
    org: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None


class CourseOut(BaseModel):
    id: UUID
    org: str  # org code (denormalized for frontend)
    code: str
    name: str
    model_config = {"from_attributes": True}


class SectionOut(BaseModel):
    id: UUID
    course_id: UUID
    year_level: int
    name: str
    capacity: int
    model_config = {"from_attributes": True}
