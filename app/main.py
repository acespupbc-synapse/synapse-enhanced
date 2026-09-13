"""
app/main.py — ACES Synapse Enhanced FastAPI Application
"""
import asyncio
import os
import sys

# Windows: psycopg3 async requires SelectorEventLoop (not ProactorEventLoop default on Windows)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.routers import auth, admin, students, programs, settings as settings_router, export

settings_cfg = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: on Linux, warm up headless JRE for MDB generation in the background
    if sys.platform != "win32":
        from app.core.mdb_generator import ensure_linux_jre
        asyncio.create_task(asyncio.to_thread(ensure_linux_jre))
    yield
    # Shutdown: close engine connections
    from app.core.database import engine
    await engine.dispose()


app = FastAPI(
    title="ACES Synapse Enhanced API",
    description="Student administration and CardFive MDB sync engine for PUP Bataan ACES",
    version="2.2.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_cfg.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(students.router)
app.include_router(programs.router)
app.include_router(settings_router.router)
app.include_router(export.router)

# ── Health Check & Root (public) ───────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {
        "status": "online",
        "service": "ACES Synapse Enhanced API",
        "version": "2.2.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health_check():
    from app.core.mdb_generator import get_java_executable, is_mdb_driver_available
    java_cmd = get_java_executable()
    odbc_available = is_mdb_driver_available()
    return {
        "status": "healthy",
        "service": "aces-synapse-enhanced",
        "version": "2.2.0",
        "database": "supabase-postgresql",
        "platform": sys.platform,
        "java_cmd": java_cmd,
        "odbc_available": odbc_available,
        "mdb_engine_ready": bool(odbc_available or java_cmd),
    }


# ── SPA Static File Hosting (production build) ────────────────────────────────
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    img_dir = os.path.join(dist_dir, "img")

    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    if os.path.exists(img_dir):
        app.mount("/img", StaticFiles(directory=img_dir), name="img")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
