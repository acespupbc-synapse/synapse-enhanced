"""performance_and_trgm_indexes

Revision ID: 002_performance_indexes
Revises: 001_canonical
Create Date: 2026-09-20

Adds composite performance indexes, unique constraints, and pg_trgm GIN indexes
for fast ILIKE student searching and efficient dashboard filtering.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '002_performance_indexes'
down_revision = '001_canonical'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Phase 3.1: Composite and ordering indexes for students & sections ────────
    op.create_index('ix_students_course_deleted', 'students', ['course_id', 'deleted_at'])
    op.create_index('ix_students_section_deleted', 'students', ['section_id', 'deleted_at'])
    op.create_index('ix_students_status_deleted', 'students', ['status', 'deleted_at'])
    op.create_index('ix_students_created_at', 'students', ['created_at'])
    op.create_index('ix_students_updated_at', 'students', ['updated_at'])

    # Ensure uniqueness of section names within a course (e.g. BSCpE 1-1)
    op.create_unique_constraint('uq_sections_course_name', 'sections', ['course_id', 'name'])

    # ── Phase 3.2: pg_trgm extension and GIN indexes for fast ILIKE search ──────
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_students_first_name_trgm ON students USING GIN (first_name gin_trgm_ops);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_students_last_name_trgm ON students USING GIN (last_name gin_trgm_ops);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_students_student_number_trgm ON students USING GIN (student_number gin_trgm_ops);"
    )


def downgrade() -> None:
    # ── Drop pg_trgm GIN indexes ────────────────────────────────────────────────
    op.execute("DROP INDEX IF EXISTS ix_students_student_number_trgm;")
    op.execute("DROP INDEX IF EXISTS ix_students_last_name_trgm;")
    op.execute("DROP INDEX IF EXISTS ix_students_first_name_trgm;")

    # ── Drop unique constraint and composite indexes ─────────────────────────────
    op.drop_constraint('uq_sections_course_name', 'sections', type_='unique')
    op.drop_index('ix_students_updated_at', table_name='students')
    op.drop_index('ix_students_created_at', table_name='students')
    op.drop_index('ix_students_status_deleted', table_name='students')
    op.drop_index('ix_students_section_deleted', table_name='students')
    op.drop_index('ix_students_course_deleted', table_name='students')
