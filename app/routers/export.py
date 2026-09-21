"""
app/routers/export.py — Data export endpoints

GET /api/admin/exports/csv     — CardFive MDB-compatible CSV
GET /api/admin/exports/xlsx    — Excel export
GET /api/admin/exports/pdf     — PDF student list
"""
import io
from datetime import datetime

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.config import Course, Section
from app.models.student import Student
from app.schemas.export import transform_student_to_mdb_csv

router = APIRouter(prefix="/api/admin/exports", tags=["exports"])


async def _get_active_ay_name(db: AsyncSession) -> str:
    """Fetch the active academic year name from system settings."""
    from app.models.config import SystemSettings
    from sqlalchemy.orm import selectinload
    try:
        settings_result = await db.execute(
            select(SystemSettings).options(selectinload(SystemSettings.active_ay)).limit(1)
        )
        system_settings = settings_result.scalar_one_or_none()
        if system_settings and system_settings.active_ay:
            return system_settings.active_ay.name.replace("AY", "").strip()
    except Exception:
        pass
    return "2026-2027"


async def _get_active_students(
    db: AsyncSession,
    program: Optional[str] = None,
    section: Optional[str] = None,
):
    from app.models.config import SystemSettings
    # Resolve active AY to filter exports to the current academic year only
    settings_res = await db.execute(select(SystemSettings).limit(1))
    sys_settings = settings_res.scalar_one_or_none()
    active_ay_id = sys_settings.active_ay_id if sys_settings else None

    query = (
        select(Student)
        .options(
            selectinload(Student.course),
            selectinload(Student.section),
            selectinload(Student.academic_year),
        )
        .where(Student.deleted_at.is_(None))
    )

    # Always scope to active AY when set
    if active_ay_id:
        query = query.where(Student.academic_year_id == active_ay_id)

    if program:
        clean_prog = program.strip().upper()
        if clean_prog in ("BSP", "BSPSY"):
            query = query.join(Student.course).where(func.upper(Course.code).in_(["BSP", "BSPSY"]))
        else:
            query = query.join(Student.course).where(func.upper(Course.code) == clean_prog)
    if section:
        query = query.join(Student.section).where(func.upper(Section.name) == section.strip().upper())

    query = query.order_by(Student.last_name, Student.first_name)
    result = await db.execute(query)
    return result.scalars().all()


# ── CSV Export ────────────────────────────────────────────────────────────────

@router.get("/csv")
async def export_csv(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    students = await _get_active_students(db, program=program, section=section)

    headers = [
        "STUDNO", "LASTNAME", "GENDER", "MDLENAME", "BRTHPLCE", "ADMSYEAR",
        "FRSTNAME", "BRTHDATE", "EMAILADR", "MPHNNMBR", "PERMBLDG", "PROGCODE",
        "PERMDSTR", "PERMCITY", "PERMSTAD", "PERMCTRY", "PERMPOST", "PHNENMBR",
        "PERMSTRT", "CTCTPRSN", "CTCTBLDG", "CTCTDSTR", "CTCTCITY", "CTCTSTAD",
        "CTCTPOST", "CPHNNMBR", "CTCTSTRT", "RCRDDATE", "CTCTNMBR", "ACADLEVL",
    ]

    rows = [",".join(headers)]
    for s in students:
        try:
            record = transform_student_to_mdb_csv(s)
            row = [f'"{getattr(record, h, "")}"' for h in headers]
            rows.append(",".join(row))
        except Exception:
            continue

    # Resolve active AY for filename
    ay_name = await _get_active_ay_name(db)
    base_filename = f"PUP Binan AY {ay_name}.csv"

    return Response(
        content="\n".join(rows),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{base_filename.replace(' ', '%20')}"},
    )


# ── MDB & Media Package Export ────────────────────────────────────────────────

@router.get("/mdb")
async def export_mdb(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    from app.core.config import get_settings
    from app.core.mdb_generator import generate_mdb_bytes
    from app.core.r2_storage import _get_client

    students = await _get_active_students(db, program=program, section=section)

    # 1. Download all photos and signatures for this section in parallel
    all_r2_keys = list({
        key
        for s in students
        for key in [s.photo_r2_key, s.signature_r2_key]
        if key
    })

    media_cache = {}
    if all_r2_keys:
        try:
            settings_cfg = get_settings()
            r2_client = _get_client()
            bucket = settings_cfg.cf_r2_bucket_name

            def _fetch_one(key):
                obj = r2_client.get_object(Bucket=bucket, Key=key)
                return key, obj["Body"].read()

            with ThreadPoolExecutor(max_workers=20) as pool:
                futures = {pool.submit(_fetch_one, k): k for k in all_r2_keys}
                for fut in as_completed(futures):
                    try:
                        key, data = fut.result()
                        media_cache[key] = data
                    except Exception:
                        pass
        except Exception as e:
            print(f"[WARN] Failed to fetch media for MDB: {e}")

    # 2. Generate MDB with all binary photos and signatures embedded
    mdb_bytes = generate_mdb_bytes(students, media_cache)

    ay_name = await _get_active_ay_name(db)
    raw_prog = (program or "ALL").strip().upper()
    prog_code = "BSP" if raw_prog in ("BSPSY", "BSP") else raw_prog
    sec_code = (section or "ALL").strip().replace(" ", "_")
    base_filename = f"{ay_name}_{prog_code}_{sec_code}.mdb"

    return Response(
        content=mdb_bytes,
        media_type="application/x-msaccess",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{base_filename.replace(' ', '%20')}"},
    )


# ── Photos & Signatures Media Export (ZIP) ───────────────────────────────────

@router.get("/media")
async def export_media(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    import os
    import re
    import tempfile
    import zipfile
    from concurrent.futures import ThreadPoolExecutor, as_completed
    from fastapi.responses import FileResponse
    from starlette.background import BackgroundTask
    from app.core.config import get_settings
    from app.core.r2_storage import _get_client

    students = await _get_active_students(db, program=program, section=section)

    # 1. Collect all unique photo and signature keys
    all_r2_keys = list({
        key
        for s in students
        for key in [s.photo_r2_key, s.signature_r2_key]
        if key
    })

    media_cache = {}
    if all_r2_keys:
        try:
            settings_cfg = get_settings()
            r2_client = _get_client()
            bucket = settings_cfg.cf_r2_bucket_name

            def _fetch_one(key):
                obj = r2_client.get_object(Bucket=bucket, Key=key)
                return key, obj["Body"].read()

            with ThreadPoolExecutor(max_workers=20) as pool:
                futures = {pool.submit(_fetch_one, k): k for k in all_r2_keys}
                for fut in as_completed(futures):
                    try:
                        key, data = fut.result()
                        media_cache[key] = data
                    except Exception:
                        pass
        except Exception as e:
            print(f"[WARN] Failed to fetch media: {e}")

    # 2. Package PICTURES/ and SIGNATURES/ folders into a lightweight ZIP
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp_zip_path = tmp.name

    ay_name = await _get_active_ay_name(db)
    raw_prog = (program or "ALL").strip().upper()
    prog_code = "BSP" if raw_prog in ("BSPSY", "BSP") else raw_prog
    sec_code = (section or "ALL").strip().replace(" ", "_")
    zip_filename = f"{ay_name}_{prog_code}_{sec_code}_Photos_and_Signatures.zip"

    with zipfile.ZipFile(tmp_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        written_paths = set()
        for s in students:
            surname = re.sub(r'[^A-Za-z0-9]', '', s.last_name or '').upper()
            firstname = re.sub(r'[^A-Za-z0-9]', '', s.first_name or '').upper()
            mi = re.sub(r'[^A-Za-z0-9]', '', (s.middle_name or '')[:1]).upper()
            s_num = re.sub(r'[^A-Za-z0-9]', '', s.student_number or '').upper()
            name_part = f"{surname}_{firstname}_{mi}".strip('_')

            if s.photo_r2_key and s.photo_r2_key in media_cache:
                pic_path = f"PICTURES/{name_part}__PICTURE.JPG"
                if pic_path in written_paths:
                    pic_path = f"PICTURES/{name_part}_{s_num}__PICTURE.JPG"
                zf.writestr(pic_path, media_cache[s.photo_r2_key])
                written_paths.add(pic_path)

            if s.signature_r2_key and s.signature_r2_key in media_cache:
                sig_path = f"SIGNATURES/{name_part}__SIGNATURE.JPG"
                if sig_path in written_paths:
                    sig_path = f"SIGNATURES/{name_part}_{s_num}__SIGNATURE.JPG"
                zf.writestr(sig_path, media_cache[s.signature_r2_key])
                written_paths.add(sig_path)

    def _cleanup_temp_zip():
        try:
            if os.path.exists(tmp_zip_path):
                os.unlink(tmp_zip_path)
        except Exception:
            pass

    return FileResponse(
        path=tmp_zip_path,
        media_type="application/zip",
        filename=zip_filename,
        background=BackgroundTask(_cleanup_temp_zip),
    )


# ── XLSX Export ───────────────────────────────────────────────────────────────

@router.get("/xlsx")
async def export_xlsx(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    students = await _get_active_students(db, program=program, section=section)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"{program or 'All'}_{section or 'Students'}"[:31]

    col_headers = [
        "Student No.", "Last Name", "First Name", "Middle Name", "Gender",
        "Birth Date", "Email", "Course", "Section", "Year Level",
        "Academic Year", "Residential Address", "Contact Person",
        "Contact Number", "Contact Address", "Status", "Registered On",
    ]

    # Header row styling
    header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11)

    for col_idx, header in enumerate(col_headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Data rows
    for row_idx, s in enumerate(students, start=2):
        ws.cell(row=row_idx, column=1, value=s.student_number)
        ws.cell(row=row_idx, column=2, value=s.last_name)
        ws.cell(row=row_idx, column=3, value=s.first_name)
        ws.cell(row=row_idx, column=4, value=s.middle_name or "")
        ws.cell(row=row_idx, column=5, value=s.gender or "")
        ws.cell(row=row_idx, column=6, value=s.birth_date.strftime("%Y-%m-%d") if s.birth_date else "")
        ws.cell(row=row_idx, column=7, value=s.email)
        ws.cell(row=row_idx, column=8, value=s.course.code if s.course else "")
        ws.cell(row=row_idx, column=9, value=s.section.name if s.section else "")
        ws.cell(row=row_idx, column=10, value=s.section.year_level if s.section else "")
        ws.cell(row=row_idx, column=11, value=s.academic_year.name if s.academic_year else "")
        ws.cell(row=row_idx, column=12, value=s.perm_strt or "")
        ws.cell(row=row_idx, column=13, value=s.contact_person_name or "")
        ws.cell(row=row_idx, column=14, value=s.contact_person_number or "")
        ws.cell(row=row_idx, column=15, value=s.contact_strt or "")
        ws.cell(row=row_idx, column=16, value=s.status)
        ws.cell(row=row_idx, column=17, value=s.created_at.strftime("%Y-%m-%d") if s.created_at else "")

    # Auto-fit columns
    for col in ws.columns:
        max_len = max((len(str(cell.value or "")) for cell in col), default=0)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    ay_name = await _get_active_ay_name(db)
    raw_prog = (program or "ALL").strip().upper()
    prog_code = "BSP" if raw_prog in ("BSPSY", "BSP") else raw_prog
    sec_code = (section or "ALL").strip().replace(" ", "_")
    base_xlsx_filename = f"{ay_name}_{prog_code}_{sec_code}.xlsx" if (program or section) else f"PUP Binan AY {ay_name}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{base_xlsx_filename.replace(' ', '%20')}"},
    )


# ── PDF Export ────────────────────────────────────────────────────────────────

@router.get("/pdf")
async def export_pdf(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )

    students = await _get_active_students(db, program=program, section=section)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    subtitle = ""
    if program and section:
        subtitle = f" — {program} ({section})"
    elif program:
        subtitle = f" — {program}"

    # Title
    title = Paragraph(
        f"<font size='14'><b>ACES Synapse — Student Registration Report{subtitle}</b></font>",
        styles["Normal"],
    )
    elements.append(title)
    elements.append(Spacer(1, 8 * mm))

    # Table data
    table_headers = [
        "Student No.", "Last Name", "First Name", "Course", "Section",
        "Gender", "Email", "Contact Person", "Contact No.", "Status",
    ]
    data = [table_headers]
    for s in students:
        data.append([
            s.student_number,
            s.last_name,
            s.first_name,
            s.course.code if s.course else "",
            s.section.name if s.section else "",
            s.gender or "",
            s.email,
            s.contact_person_name or "",
            s.contact_person_number or "",
            s.status,
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8B0000")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTSIZE", (0, 1), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    elements.append(table)

    date_str = datetime.now().strftime("%Y-%m-%d")
    footer = Paragraph(
        f"<font size='7' color='grey'>Generated: {datetime.now().strftime('%B %d, %Y %H:%M')} | Total Records: {len(students)}</font>",
        styles["Normal"],
    )
    elements.append(Spacer(1, 5 * mm))
    elements.append(footer)

    doc.build(elements)
    buffer.seek(0)

    tag = ""
    if program and section:
        tag = f"_{program}_{section}"
    elif program:
        tag = f"_{program}"
    filename = f"ACES_Synapse_Report{tag}_{date_str}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )




