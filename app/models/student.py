"""
app/models/student.py — Student canonical ORM model (PostgreSQL)

Canonical model — NOT a 1:1 mapping of legacy SQLite or MDB.
MDB export is handled by a separate transform layer in app/schemas/export.py.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class RegistrationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_number = Column(String(30), unique=True, nullable=False, index=True)
    status = Column(
        Enum(RegistrationStatus, name="registration_status_enum"),
        default=RegistrationStatus.PENDING,
        nullable=False,
    )

    # ── Personal Info ────────────────────────────────────────────────────────
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=False)
    email = Column(String(255), nullable=False)

    # ── Academic Relations ───────────────────────────────────────────────────
    academic_year_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id"), nullable=True)
    organization = Column(String(20), nullable=True)  # org code, denormalized for query speed

    academic_year = relationship("AcademicYear", back_populates="students", lazy="select")
    course = relationship("Course", lazy="select")
    section = relationship("Section", back_populates="students", lazy="select")

    # ── Personal Address (MDB: PERM*) ────────────────────────────────────────
    perm_strt = Column(Text, nullable=False)           # full street address (PERMSTRT)
    perm_bldg = Column(String(100), nullable=True)     # building/lot number
    perm_dstr = Column(String(100), nullable=True)     # district/barangay
    perm_city = Column(String(100), nullable=True)     # city/municipality
    perm_stad = Column(String(100), nullable=True)     # province/state
    perm_ctry = Column(String(100), nullable=True)     # country
    perm_post = Column(String(20), nullable=True)      # zip/postal code

    # ── Emergency Contact (MDB: CTCT*) ───────────────────────────────────────
    contact_person_name = Column(String(200), nullable=False)
    contact_person_number = Column(String(30), nullable=False)   # CTCTNMBR (primary)
    contact_person_number2 = Column(String(30), nullable=True)   # CPHNNMBR (secondary)
    contact_person_number3 = Column(String(30), nullable=True)   # PHNENMBR (tertiary)
    contact_strt = Column(Text, nullable=False)                  # CTCTSTRT
    contact_bldg = Column(String(100), nullable=True)
    contact_dstr = Column(String(100), nullable=True)
    contact_city = Column(String(100), nullable=True)
    contact_stad = Column(String(100), nullable=True)
    contact_ctry = Column(String(100), nullable=True)
    contact_post = Column(String(20), nullable=True)

    # ── Media (stored in Cloudflare R2) ──────────────────────────────────────
    photo_r2_key = Column(Text, nullable=True)       # R2 object key (not a public URL)
    signature_r2_key = Column(Text, nullable=True)   # R2 object key (not a public URL)

    # ── Timestamps & Soft Delete ─────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # None = active

    def __repr__(self):
        return f"<Student {self.student_number} — {self.last_name}, {self.first_name}>"
