"""
app/models/config.py — Academic configuration ORM models:
  AcademicYear, Organization, Course, Section, SystemSettings
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "2025-2026"
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    students = relationship("Student", back_populates="academic_year", lazy="select")

    def __repr__(self):
        return f"<AcademicYear {self.name}>"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)  # e.g. "ACES"
    name = Column(String(255), nullable=False)
    theme_color = Column(String(20), nullable=True)
    logo_url = Column(Text, nullable=True)

    courses = relationship("Course", back_populates="organization", lazy="select")

    def __repr__(self):
        return f"<Organization {self.code}>"


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    code = Column(String(30), unique=True, nullable=False, index=True)  # e.g. "BSCpE"
    name = Column(String(255), nullable=False)

    organization = relationship("Organization", back_populates="courses", lazy="select")
    sections = relationship("Section", back_populates="course", lazy="select")

    def __repr__(self):
        return f"<Course {self.code}>"


class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    year_level = Column(Integer, nullable=False)  # 1, 2, 3, 4
    name = Column(String(20), nullable=False)  # e.g. "1-1"
    capacity = Column(Integer, default=50, nullable=False)

    course = relationship("Course", back_populates="sections", lazy="select")
    students = relationship("Student", back_populates="section", lazy="select")

    def __repr__(self):
        return f"<Section {self.name}>"


class SystemSettings(Base):
    """Single-row settings table. Use get_or_create pattern."""
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_open = Column(Boolean, default=True, nullable=False)
    active_ay_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    active_ay = relationship("AcademicYear", lazy="select")

    def __repr__(self):
        return f"<SystemSettings registration_open={self.registration_open}>"
