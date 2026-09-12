import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.config import generate_uuid

class RegistrationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_number = Column(String, unique=True, index=True) # e.g., 2025-00416-BN-0
    
    # Personal Info
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=False)
    gender = Column(String, nullable=True) # e.g. MALE, FEMALE
    birth_date = Column(Date, nullable=False)
    email = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING)
    
    # Academic Relations
    academic_year_id = Column(String, ForeignKey("academic_years.id"))
    section_id = Column(String, ForeignKey("sections.id"))

    academic_year = relationship("AcademicYear", back_populates="students")
    section = relationship("Section", back_populates="students")

    # Personal Address Fields (mapped to MDB PERM*)
    perm_bldg = Column(String, nullable=True)
    perm_dstr = Column(String, nullable=True)
    perm_city = Column(String, nullable=True)
    perm_stad = Column(String, nullable=True) # Province/State
    perm_ctry = Column(String, nullable=True)
    perm_post = Column(String, nullable=True) # Zip Code
    perm_strt = Column(String, nullable=False) # Full Street Address fallback
    
    # Emergency Contact Details (mapped to MDB CTCT*)
    contact_person_name = Column(String, nullable=False)
    contact_person_number = Column(String, nullable=False) # CTCTNMBR (Num 1)
    contact_person_number2 = Column(String, nullable=True) # CPHNNMBR (Num 2)
    contact_person_number3 = Column(String, nullable=True) # PHNENMBR (Num 3)
    
    # Emergency Contact Address
    contact_bldg = Column(String, nullable=True)
    contact_dstr = Column(String, nullable=True)
    contact_city = Column(String, nullable=True)
    contact_stad = Column(String, nullable=True)
    contact_ctry = Column(String, nullable=True)
    contact_post = Column(String, nullable=True)
    contact_strt = Column(String, nullable=False) # Full Street Address fallback
    
    # Timestamps & Soft Delete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True) # If set, record is soft-deleted
