# ACES Synapse Enhanced

Modernization and redesign of the ACES Synapse student registration and administration system for PUP Bataan ACES. Replaces the legacy Python/SQLite system with a production-grade stack featuring async FastAPI, PostgreSQL, Cloudflare R2 media storage, and a React SPA.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.14 · FastAPI · SQLAlchemy 2 (async) · Alembic |
| Database | PostgreSQL (Supabase) |
| Media Storage | Cloudflare R2 (S3-compatible, presigned URLs) |
| Frontend | React 18 · Vite · Vanilla CSS |
| Auth | JWT (HS256) · bcrypt · in-process rate limiting |
| MDB Export | Jackcess (Java) / PyODBC · CardFive-compatible CSV/MDB |
| Deployment | PythonAnywhere (backend) · Vercel (frontend analytics) |

## Features

- **Public student registration wizard** — photo/signature capture, real-time dimension validation, concurrent R2 upload
- **Admin dashboard** — live stats, enrollment feed, CPU + storage telemetry, per-program breakdowns
- **Student management** — search, filter by AY/program/section, edit, soft-delete, restore, permanent purge
- **Recycle bin** — batch purge with paginated R2 cleanup
- **Academic programs & sections** — CRUD with per-AY scoping and auto-clone on new AY creation
- **Export engine** — CardFive MDB, CSV, XLSX, PDF, and full ZIP archive (per-section + master root)
- **Settings** — registration toggle, active AY management, system diagnostics

## References

| Resource | Link |
|----------|------|
| Legacy repository | https://github.com/JOBIJEEEB/pupbc_synapse |
| Legacy live system | https://aces2026synapse.pythonanywhere.com/ |

## Repository Structure

```
AGENTS.md          # AI engineering instructions & phase rules
app/               # FastAPI application
  core/            # Config, DB engine, security, R2, MDB generator
  models/          # SQLAlchemy ORM models
  routers/         # API route handlers
  schemas/         # Pydantic request/response + MDB export transform
alembic/           # Database migrations
frontend/          # React SPA (Vite)
  src/
    components/    # UI components and views
    services/      # API client layer
docs/              # Project documentation
scripts/           # Seed and simulation utilities
tools/mdb_writer/  # Jackcess-based MDB writer (Java)
reference/         # Local reference artifacts (MDB — gitignored)
```

## Getting Started (Development)

```powershell
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Install Python deps
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 3. Run database migrations
alembic upgrade head

# 4. Start dev server (backend + frontend concurrently)
python run_dev.py
```

Frontend available at `http://localhost:5173`, API at `http://localhost:8000`.

## Environment Variables

See [`.env.example`](./.env.example) for required configuration:

- `DATABASE_URL` — Supabase PostgreSQL connection string
- `CF_ACCOUNT_ID`, `CF_R2_BUCKET_NAME`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY` — Cloudflare R2
- `JWT_SECRET_KEY` — minimum 32-character random string
- `ALLOWED_ORIGINS` — comma-separated list of permitted CORS origins

## Documentation

- **[AGENTS.md](./AGENTS.md)** — AI/software engineering rules and phase governance
- **[bugs.md](./bugs.md)** — Known issues tracker

