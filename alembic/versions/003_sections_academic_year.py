"""sections_academic_year_id

Revision ID: 003_sections_ay
Revises: 002_perf_indexes
Create Date: 2026-09-20

Adds academic_year_id (nullable FK) to sections table so each section can be
scoped to a specific academic year. Existing sections get NULL (shared / legacy).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '003_sections_ay'
down_revision = '002_performance_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'sections',
        sa.Column(
            'academic_year_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('academic_years.id', ondelete='SET NULL'),
            nullable=True,
        )
    )
    op.create_index('ix_sections_academic_year_id', 'sections', ['academic_year_id'])
    op.execute(
        """
        UPDATE sections
        SET academic_year_id = (
            SELECT id FROM academic_years WHERE name = '2026-2027' OR is_active = true ORDER BY created_at ASC LIMIT 1
        )
        WHERE academic_year_id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index('ix_sections_academic_year_id', table_name='sections')
    op.drop_column('sections', 'academic_year_id')
