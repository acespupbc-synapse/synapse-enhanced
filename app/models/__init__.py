"""
app/models/__init__.py — Export all ORM models
Ensures all models are registered with SQLAlchemy's Declarative Base.
"""
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, Course, Organization, Section, SystemSettings
from app.models.student import RegistrationStatus, Student

__all__ = [
    "AdminUser",
    "AcademicYear",
    "Course",
    "Organization",
    "Section",
    "SystemSettings",
    "Student",
    "RegistrationStatus",
]
