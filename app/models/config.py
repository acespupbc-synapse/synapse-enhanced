import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.core.database import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True) # e.g., "AY 25-26"
    is_active = Column(Boolean, default=False)
    
    students = relationship("Student", back_populates="academic_year")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, index=True) # e.g., "ACES"
    name = Column(String)
    theme_color = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)

    courses = relationship("Course", back_populates="organization")

class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, default=generate_uuid)
    org_id = Column(String, ForeignKey("organizations.id"))
    code = Column(String, unique=True, index=True) # e.g., "BSCpE"
    name = Column(String)

    organization = relationship("Organization", back_populates="courses")
    sections = relationship("Section", back_populates="course")

class Section(Base):
    __tablename__ = "sections"

    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"))
    year_level = Column(Integer) # 1, 2, 3, 4
    name = Column(String) # e.g., "1-1"

    course = relationship("Course", back_populates="sections")
    students = relationship("Student", back_populates="section")
