import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool, engine_from_config
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

# Load .env before anything else
from dotenv import load_dotenv
load_dotenv()

from app.core.database import Base  # noqa: E402
from app.models.admin_user import AdminUser  # noqa: F401 — needed for metadata
from app.models.config import AcademicYear, Organization, Course, Section, SystemSettings  # noqa: F401
from app.models.student import Student  # noqa: F401

alembic_config = context.config

if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

target_metadata = Base.metadata

# Read the DATABASE_URL from environment (sync driver for Alembic)
def get_sync_url() -> str:
    raw = os.environ.get("DATABASE_URL", "")
    # Alembic uses sync psycopg — strip asyncpg/psycopg async suffixes
    for prefix in ("postgresql+asyncpg://", "postgresql+psycopg_async://"):
        if raw.startswith(prefix):
            raw = "postgresql" + raw[len(prefix) - 3:]
    # Ensure psycopg3 sync driver
    if raw.startswith("postgresql://") or raw.startswith("postgres://"):
        raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)
        raw = raw.replace("postgres://", "postgresql+psycopg://", 1)
    return raw


def run_migrations_offline() -> None:
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    connectable = create_engine(get_sync_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
