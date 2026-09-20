"""sections_ay_unique_constraint

Revision ID: 004_sections_ay_uq
Revises: 003_sections_ay
Create Date: 2026-09-20

Drops global uq_sections_course_name (course_id, name) and replaces it with
uq_sections_course_ay_name (course_id, academic_year_id, name) so sections with
the same name (e.g. '1-1') can exist in different academic years.
Also clones existing sections to any existing academic year that has 0 sections.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '004_sections_ay_uq'
down_revision = '003_sections_ay'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop old constraint that enforced uniqueness only across (course_id, name)
    op.execute("ALTER TABLE sections DROP CONSTRAINT IF EXISTS uq_sections_course_name;")
    op.execute("DROP INDEX IF EXISTS uq_sections_course_name;")

    # 2. Create new unique index on (course_id, academic_year_id, name)
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_sections_course_ay_name 
        ON sections (course_id, academic_year_id, name);
        """
    )

    # 3. For any academic year that currently has 0 sections (e.g. 2027-2028),
    # clone the sections from 2026-2027 so it immediately has active sections.
    op.execute(
        """
        INSERT INTO sections (id, course_id, academic_year_id, year_level, name, capacity)
        SELECT 
            gen_random_uuid(),
            s.course_id,
            target_ay.id,
            s.year_level,
            s.name,
            s.capacity
        FROM sections s
        CROSS JOIN academic_years target_ay
        WHERE s.academic_year_id = (SELECT id FROM academic_years WHERE name = '2026-2027' LIMIT 1)
          AND target_ay.id != (SELECT id FROM academic_years WHERE name = '2026-2027' LIMIT 1)
          AND NOT EXISTS (
              SELECT 1 FROM sections existing 
              WHERE existing.academic_year_id = target_ay.id
          );
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_sections_course_ay_name;")
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_sections_course_name 
        ON sections (course_id, name);
        """
    )
