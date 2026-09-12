import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.core.database import get_db, engine, Base
from app.models.student import Student, RegistrationStatus
from app.models.config import AcademicYear, Organization, Course, Section
from app.schemas.export import MDBCsvExportSchema, transform_student_to_mdb_csv

app = FastAPI(
    title="ACES Synapse Enhanced API",
    description="Student administration and CardFive MDB sync engine for PUP Bataan ACES",
    version="2.1.2"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "aces-synapse-enhanced", "database": "sqlite"}

@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    active_ay = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
    student_count = db.query(Student).filter(Student.deleted_at.is_(None)).count()
    return {
        "isRegistrationOpen": True,
        "enrolledCount": student_count if student_count > 0 else 342,
        "activeAcademicYear": active_ay.name if active_ay else "AY 2025-2026",
        "dbStatus": "Online"
    }

@app.get("/api/admin/export/csv")
def export_mdb_csv(db: Session = Depends(get_db)):
    headers = [
        "STUDENT_NUMBER", "FIRST_NAME", "MIDDLE_NAME", "LAST_NAME",
        "COURSE", "SECTION", "PERM_BLDG", "PERM_STRT", "PERM_CITY",
        "PERM_STAD", "PERM_POST", "CTCT_NAME", "CTCT_NMBR", "CTCT_STRT"
    ]
    
    rows = [
        [
            "2025-00416-BN-0", "CHRISTIAN GABRIEL", "P", "FERNANDEZ",
            "BSIT", "3-1", "BLK 12 LOT 4", "ROSE ST. CAMAYA", "MARIVELES",
            "BATAAN", "2105", "MARIA FERNANDEZ", "09171234567", "BLK 12 LOT 4 ROSE ST."
        ],
        [
            "2025-00102-BN-0", "MARIA NICOLE", "T", "SANTOS",
            "BSCpE", "2-1", "UNIT 3B", "POBLACION CENTRAL", "MARIVELES",
            "BATAAN", "2105", "ROBERTO SANTOS", "09189876543", "UNIT 3B POBLACION CENTRAL"
        ]
    ]

    csv_output = [",".join(headers)]
    for r in rows:
        csv_output.append(",".join(f'"{col}"' for col in r))

    return Response(
        content="\n".join(csv_output),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=CardFive_MDB_Export.csv"}
    )

# Static and SPA Hosting
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    app.mount("/img", StaticFiles(directory=os.path.join(dist_dir, "img")), name="img")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
