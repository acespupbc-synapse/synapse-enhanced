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
    section_count: Optional[int] = Field(default=1, ge=1, le=15)


class CourseUpdate(BaseModel):
    org: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    section_count: Optional[int] = Field(default=None, ge=1, le=15)


class SectionItem(BaseModel):
    id: UUID
    name: str
    year_level: int
    model_config = {"from_attributes": True}


class SectionUpdate(BaseModel):
    program_code: Optional[str] = None
    year_level: Optional[int] = Field(default=None, ge=1, le=5)
    name: Optional[str] = Field(default=None, min_length=1, max_length=20)


class CourseOut(BaseModel):
    id: UUID
    org: str  # org code (denormalized for frontend)
    code: str
    name: str
    section_count: int = 1
    sections: list[str] = []
    sections_detail: list[SectionItem] = []
    model_config = {"from_attributes": True}


class SectionCreate(BaseModel):
    program_code: str = Field(..., description="Program/Course code e.g. BSCpE")
    year_level: int = Field(default=1, ge=1, le=5)
    name: str = Field(..., min_length=1, max_length=20, description="Section name e.g. 1-2, 2-1")


class SectionOut(BaseModel):
    id: UUID
    course_id: UUID
    year_level: int
    name: str
    capacity: int
    model_config = {"from_attributes": True}
