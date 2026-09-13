"""postgresql_canonical_schema

Revision ID: 001_canonical
Revises: 
Create Date: 2026-09-13

Full canonical PostgreSQL schema for ACES Synapse Enhanced.
Replaces the old SQLite-based schema entirely.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_canonical'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── registration_status_enum ─────────────────────────────────────────────
    op.execute("CREATE TYPE registration_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")

    # ── academic_years ────────────────────────────────────────────────────────
    op.create_table(
        'academic_years',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_academic_years_name', 'academic_years', ['name'])

    # ── organizations ─────────────────────────────────────────────────────────
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('code', sa.String(20), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('theme_color', sa.String(20), nullable=True),
        sa.Column('logo_url', sa.Text(), nullable=True),
    )
    op.create_index('ix_organizations_code', 'organizations', ['code'])

    # ── courses ───────────────────────────────────────────────────────────────
    op.create_table(
        'courses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('code', sa.String(30), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
    )
    op.create_index('ix_courses_code', 'courses', ['code'])

    # ── sections ─────────────────────────────────────────────────────────────
    op.create_table(
        'sections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id'), nullable=False),
        sa.Column('year_level', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(20), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False, server_default='50'),
    )

    # ── admin_users ───────────────────────────────────────────────────────────
    op.create_table(
        'admin_users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('username', sa.String(100), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_admin_users_username', 'admin_users', ['username'])

    # ── system_settings ───────────────────────────────────────────────────────
    op.create_table(
        'system_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('registration_open', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('active_ay_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('academic_years.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # ── students ──────────────────────────────────────────────────────────────
    op.create_table(
        'students',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_number', sa.String(30), nullable=False, unique=True),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='registration_status_enum', create_type=False), nullable=False, server_default='PENDING'),

        # Personal Info
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('middle_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('gender', sa.String(20), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),

        # Academic Relations
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('academic_years.id'), nullable=True),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id'), nullable=True),
        sa.Column('section_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sections.id'), nullable=True),
        sa.Column('organization', sa.String(20), nullable=True),

        # Personal Address (MDB: PERM*)
        sa.Column('perm_strt', sa.Text(), nullable=False),
        sa.Column('perm_bldg', sa.String(100), nullable=True),
        sa.Column('perm_dstr', sa.String(100), nullable=True),
        sa.Column('perm_city', sa.String(100), nullable=True),
        sa.Column('perm_stad', sa.String(100), nullable=True),
        sa.Column('perm_ctry', sa.String(100), nullable=True),
        sa.Column('perm_post', sa.String(20), nullable=True),

        # Emergency Contact (MDB: CTCT*)
        sa.Column('contact_person_name', sa.String(200), nullable=False),
        sa.Column('contact_person_number', sa.String(30), nullable=False),
        sa.Column('contact_person_number2', sa.String(30), nullable=True),
        sa.Column('contact_person_number3', sa.String(30), nullable=True),
        sa.Column('contact_strt', sa.Text(), nullable=False),
        sa.Column('contact_bldg', sa.String(100), nullable=True),
        sa.Column('contact_dstr', sa.String(100), nullable=True),
        sa.Column('contact_city', sa.String(100), nullable=True),
        sa.Column('contact_stad', sa.String(100), nullable=True),
        sa.Column('contact_ctry', sa.String(100), nullable=True),
        sa.Column('contact_post', sa.String(20), nullable=True),

        # Media (Cloudflare R2 object keys)
        sa.Column('photo_r2_key', sa.Text(), nullable=True),
        sa.Column('signature_r2_key', sa.Text(), nullable=True),

        # Timestamps & Soft Delete
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_students_student_number', 'students', ['student_number'])
    op.create_index('ix_students_deleted_at', 'students', ['deleted_at'])


def downgrade() -> None:
    op.drop_table('students')
    op.drop_table('system_settings')
    op.drop_table('admin_users')
    op.drop_table('sections')
    op.drop_table('courses')
    op.drop_table('organizations')
    op.drop_table('academic_years')
    op.execute("DROP TYPE IF EXISTS registration_status_enum")
