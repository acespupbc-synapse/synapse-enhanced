"""
scripts/seed.py — Database seed script

Run once after alembic migrations to:
1. Create the superadmin account
2. Seed organizations, courses, sections
3. Create initial academic year and system settings

Usage:
    python -m scripts.seed
"""
import asyncio
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.admin_user import AdminUser
from app.models.config import AcademicYear, Organization, Course, Section, SystemSettings
from app.models.student import Student
from app.core.database import Base

settings = get_settings()

engine = create_async_engine(settings.async_database_url, echo=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# ── Seed Data ─────────────────────────────────────────────────────────────────

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "AcesAdmin@2026"  # Change after first login!
ADMIN_EMAIL = "acesorganization2022@gmail.com"

ACADEMIC_YEARS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"]
ACTIVE_AY = "2025-2026"

ORGANIZATIONS = [
    {"code": "ACES",  "name": "Association of Computer Engineering Students",       "theme_color": "#800000"},
    {"code": "HRSS",  "name": "Human Resource Students Society",                    "theme_color": "#c0392b"},
    {"code": "IBITS", "name": "Institute of Bachelors in Information Technology Studies", "theme_color": "#058EA3"},
    {"code": "PIIE",  "name": "Philippine Institute of Industrial Engineers",        "theme_color": "#16AB68"},
    {"code": "SMS",   "name": "Samahan ng mga Mag-aaral ng Sikolohiya",             "theme_color": "#4F0580"},
    {"code": "YES",   "name": "Young Educators' Society",                           "theme_color": "#090979"},
]

COURSES = [
    {"org": "ACES",  "code": "BSCpE",    "name": "Bachelor of Science in Computer Engineering"},
    {"org": "ACES",  "code": "DCpET",    "name": "Diploma in Computer Engineering Technology"},
    {"org": "HRSS",  "code": "BSBA-HRM", "name": "Bachelor of Science in Business Administration Major in Human Resource Management"},
    {"org": "IBITS", "code": "BSIT",     "name": "Bachelor of Science in Information Technology"},
    {"org": "IBITS", "code": "DIT",      "name": "Diploma in Information Technology"},
    {"org": "PIIE",  "code": "BSIE",     "name": "Bachelor of Science in Industrial Engineering"},
    {"org": "SMS",   "code": "BSPSY",    "name": "Bachelor of Science in Psychology"},
    {"org": "YES",   "code": "BSED-ENG", "name": "Bachelor of Secondary Education Major in English"},
    {"org": "YES",   "code": "BSED-SS",  "name": "Bachelor of Secondary Education Major in Social Studies"},
    {"org": "YES",   "code": "BEED",     "name": "Bachelor of Elementary Education"},
]

# Sections: {course_code: [(year_level, section_name), ...]}
SECTIONS = {
    "BSCpE":    [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "DCpET":    [(1, "1-1"), (1, "1-2")],
    "BSBA-HRM": [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "BSIT":     [(1, "1-1"), (1, "1-2"), (2, "2-1"), (2, "2-2"), (3, "3-1"), (4, "4-1")],
    "DIT":      [(1, "1-1"), (1, "1-2")],
    "BSIE":     [(1, "1-1"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "BSPSY":    [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "BSED-ENG": [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "BSED-SS":  [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
    "BEED":     [(1, "1-1"), (1, "1-2"), (2, "2-1"), (3, "3-1"), (4, "4-1")],
}


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Admin User ────────────────────────────────────────────────────────
        existing_admin = await db.execute(
            select(AdminUser).where(AdminUser.username == ADMIN_USERNAME)
        )
        if not existing_admin.scalar_one_or_none():
            admin = AdminUser(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
            )
            db.add(admin)
            print(f"✅ Admin user '{ADMIN_USERNAME}' created. Password: {ADMIN_PASSWORD}")
        else:
            print(f"ℹ️  Admin '{ADMIN_USERNAME}' already exists — skipped.")

        # ── Academic Years ────────────────────────────────────────────────────
        active_ay_obj = None
        for ay_name in ACADEMIC_YEARS:
            existing = await db.execute(select(AcademicYear).where(AcademicYear.name == ay_name))
            ay = existing.scalar_one_or_none()
            if not ay:
                ay = AcademicYear(name=ay_name, is_active=(ay_name == ACTIVE_AY))
                db.add(ay)
                print(f"✅ Academic Year '{ay_name}' created{' [ACTIVE]' if ay_name == ACTIVE_AY else ''}.")
            else:
                if ay_name == ACTIVE_AY:
                    ay.is_active = True
                print(f"ℹ️  Academic Year '{ay_name}' exists — skipped.")
            if ay_name == ACTIVE_AY:
                active_ay_obj = ay

        await db.flush()

        # ── System Settings ───────────────────────────────────────────────────
        sys_result = await db.execute(select(SystemSettings).limit(1))
        sys_settings = sys_result.scalar_one_or_none()
        if not sys_settings:
            sys_settings = SystemSettings(
                registration_open=True,
                active_ay_id=active_ay_obj.id if active_ay_obj else None,
            )
            db.add(sys_settings)
            print("✅ System settings initialized.")
        else:
            print("ℹ️  System settings already exist — skipped.")

        # ── Organizations ─────────────────────────────────────────────────────
        org_map = {}
        for org_data in ORGANIZATIONS:
            existing = await db.execute(
                select(Organization).where(Organization.code == org_data["code"])
            )
            org = existing.scalar_one_or_none()
            if not org:
                org = Organization(**org_data)
                db.add(org)
                print(f"✅ Organization '{org_data['code']}' created.")
            else:
                print(f"ℹ️  Organization '{org_data['code']}' exists — skipped.")
            org_map[org_data["code"]] = org

        await db.flush()

        # ── Courses ───────────────────────────────────────────────────────────
        course_map = {}
        for course_data in COURSES:
            existing = await db.execute(
                select(Course).where(Course.code == course_data["code"])
            )
            course = existing.scalar_one_or_none()
            if not course:
                org = org_map[course_data["org"]]
                course = Course(
                    org_id=org.id,
                    code=course_data["code"],
                    name=course_data["name"],
                )
                db.add(course)
                print(f"✅ Course '{course_data['code']}' created.")
            else:
                print(f"ℹ️  Course '{course_data['code']}' exists — skipped.")
            course_map[course_data["code"]] = course

        await db.flush()

        # ── Sections ──────────────────────────────────────────────────────────
        for course_code, sections in SECTIONS.items():
            course = course_map.get(course_code)
            if not course:
                continue
            for year_level, section_name in sections:
                existing = await db.execute(
                    select(Section).where(
                        Section.course_id == course.id,
                        Section.year_level == year_level,
                        Section.name == section_name,
                    )
                )
                if not existing.scalar_one_or_none():
                    section = Section(
                        course_id=course.id,
                        year_level=year_level,
                        name=section_name,
                        capacity=50,
                    )
                    db.add(section)
                    print(f"✅ Section '{course_code} {section_name}' (Year {year_level}) created.")

        await db.commit()
        print("\n🎉 Seed complete!")
        print(f"\n🔐 Admin login: username={ADMIN_USERNAME}  password={ADMIN_PASSWORD}")
        print("⚠️  Change the admin password immediately after first login!")


if __name__ == "__main__":
    asyncio.run(seed())
