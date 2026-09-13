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


async def _get_active_students(
    db: AsyncSession,
    program: Optional[str] = None,
    section: Optional[str] = None,
):
    query = (
        select(Student)
        .options(
            selectinload(Student.course),
            selectinload(Student.section),
            selectinload(Student.academic_year),
        )
        .where(Student.deleted_at.is_(None))
    )
    if program:
        query = query.join(Student.course).where(func.upper(Course.code) == program.strip().upper())
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

    date_str = datetime.now().strftime("%Y-%m-%d")
    tag = ""
    if program and section:
        tag = f"_{program}_{section}"
    elif program:
        tag = f"_{program}"
    filename = f"CardFive_MDB_Export{tag}_{date_str}.csv"

    return Response(
        content="\n".join(rows),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
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

    date_str = datetime.now().strftime("%Y-%m-%d")
    tag = ""
    if program and section:
        tag = f"_{program}_{section}"
    elif program:
        tag = f"_{program}"
    filename = f"ACES_Synapse_Export{tag}_{date_str}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
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


# ── Full Complete Archive Export (ZIP: CSV + XLSX + JSON + Photos + Signatures) ────────

@router.get("/archive")
async def export_archive(
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    import json
    import re
    import zipfile
    import openpyxl
    from app.core.config import get_settings
    from app.core.r2_storage import _get_client

    settings_cfg = get_settings()
    students = await _get_active_students(db)

    # 1. Generate CardFive MDB CSV
    csv_headers = [
        "STUDNO", "LASTNAME", "GENDER", "MDLENAME", "BRTHPLCE", "ADMSYEAR",
        "FRSTNAME", "BRTHDATE", "EMAILADR", "MPHNNMBR", "PERMBLDG", "PROGCODE",
        "PERMDSTR", "PERMCITY", "PERMSTAD", "PERMCTRY", "PERMPOST", "PHNENMBR",
        "PERMSTRT", "CTCTPRSN", "CTCTBLDG", "CTCTDSTR", "CTCTCITY", "CTCTSTAD",
        "CTCTPOST", "CPHNNMBR", "CTCTSTRT", "RCRDDATE", "CTCTNMBR", "ACADLEVL",
    ]
    csv_rows = [",".join(csv_headers)]
    for s in students:
        try:
            record = transform_student_to_mdb_csv(s)
            row = [f'"{getattr(record, h, "")}"' for h in csv_headers]
            csv_rows.append(",".join(row))
        except Exception:
            continue
    csv_data = "\n".join(csv_rows)

    # 2. Generate Excel (XLSX)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Student Registrations"
    col_headers = [
        "Student No.", "Last Name", "First Name", "Middle Name", "Gender",
        "Birth Date", "Email", "Course", "Section", "Year Level",
        "Academic Year", "Residential Address", "Contact Person",
        "Contact Number", "Contact Address", "Status", "Registered On",
    ]
    for col_idx, h in enumerate(col_headers, start=1):
        ws.cell(row=1, column=col_idx, value=h)
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
    xlsx_buf = io.BytesIO()
    wb.save(xlsx_buf)
    xlsx_data = xlsx_buf.getvalue()

    # 3. Generate JSON database records
    json_records = []
    for s in students:
        json_records.append({
            "id": str(s.id),
            "student_number": s.student_number,
            "first_name": s.first_name,
            "middle_name": s.middle_name,
            "last_name": s.last_name,
            "gender": s.gender,
            "birth_date": s.birth_date.isoformat() if s.birth_date else None,
            "email": s.email,
            "course": s.course.code if s.course else None,
            "section": s.section.name if s.section else None,
            "academic_year": s.academic_year.name if s.academic_year else None,
            "residential_address": s.perm_strt,
            "contact_person": s.contact_person_name,
            "contact_number": s.contact_person_number,
            "photo_key": s.photo_r2_key,
            "signature_key": s.signature_r2_key,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    json_data = json.dumps({
        "archiveType": "ACES_SYNAPSE_COMPLETE_ARCHIVE",
        "exportedAt": datetime.now().isoformat(),
        "totalRecords": len(students),
        "records": json_records
    }, indent=2)

    # 4. Assemble ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("CardFive_MDB_Export.csv", csv_data)
        zf.writestr("Students_Roster.xlsx", xlsx_data)
        zf.writestr("Database_Records.json", json_data)
        zf.writestr("README.txt", f"ACES Synapse Complete Backup Archive\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\nTotal Student Records: {len(students)}\n")

        # 4. Download media from R2 into local cache
        media_cache = {}
        try:
            r2_client = _get_client()
            bucket = settings_cfg.cf_r2_bucket_name
            for s in students:
                if s.photo_r2_key and s.photo_r2_key not in media_cache:
                    try:
                        obj = r2_client.get_object(Bucket=bucket, Key=s.photo_r2_key)
                        media_cache[s.photo_r2_key] = obj["Body"].read()
                    except Exception:
                        pass
                if s.signature_r2_key and s.signature_r2_key not in media_cache:
                    try:
                        obj = r2_client.get_object(Bucket=bucket, Key=s.signature_r2_key)
                        media_cache[s.signature_r2_key] = obj["Body"].read()
                    except Exception:
                        pass
        except Exception as e:
            print(f"[WARN] Archive R2 media bundle: {e}")

        # 5. Write media in structured folders: {ay}/{course}/{section}/PICTURES/ and SIGNATURES/
        for s in students:
            surname = re.sub(r'[^A-Za-z0-9]', '', s.last_name or '').upper()
            firstname = re.sub(r'[^A-Za-z0-9]', '', s.first_name or '').upper()
            mi = re.sub(r'[^A-Za-z0-9]', '', (s.middle_name or '')[:1]).upper()
            name_part = f"{surname}_{firstname}_{mi}".strip('_')

            ay_dir = (s.academic_year.name if s.academic_year else "2026-2027").replace("AY", "").strip()
            course_dir = s.course.code if s.course else "BSCpE"
            sec_dir = s.section.name if s.section else "1-1"

            if s.photo_r2_key and s.photo_r2_key in media_cache:
                pic_path = f"{ay_dir}/{course_dir}/{sec_dir}/PICTURES/{name_part}__PICTURE.JPG"
                zf.writestr(pic_path, media_cache[s.photo_r2_key])

            if s.signature_r2_key and s.signature_r2_key in media_cache:
                sig_path = f"{ay_dir}/{course_dir}/{sec_dir}/SIGNATURES/{name_part}__SIGNATURE.JPG"
                zf.writestr(sig_path, media_cache[s.signature_r2_key])

        # 6. Include CardFive MDB with Long Binary photo and signature data
        try:
            from app.core.mdb_generator import generate_mdb_bytes
            mdb_bytes = generate_mdb_bytes(students, media_cache)
            zf.writestr("CardFive_Database.mdb", mdb_bytes)
        except Exception as err:
            print(f"[WARN] Failed to write MDB into archive: {err}")

    zip_buffer.seek(0)
    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"ACES_Synapse_Complete_Archive_{date_str}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Direct CardFive MDB Export Endpoint ───────────────────────────────────────

@router.get("/mdb")
async def export_mdb(
    program: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    """Generate and download CardFive MS Access .MDB file with Long Binary photos & signatures."""
    from app.core.config import get_settings
    from app.core.mdb_generator import generate_mdb_bytes
    from app.core.r2_storage import _get_client

    settings_cfg = get_settings()
    students = await _get_active_students(db, program, section, academic_year)

    media_cache = {}
    try:
        r2_client = _get_client()
        bucket = settings_cfg.cf_r2_bucket_name
        for s in students:
            if s.photo_r2_key and s.photo_r2_key not in media_cache:
                try:
                    obj = r2_client.get_object(Bucket=bucket, Key=s.photo_r2_key)
                    media_cache[s.photo_r2_key] = obj["Body"].read()
                except Exception:
                    pass
            if s.signature_r2_key and s.signature_r2_key not in media_cache:
                try:
                    obj = r2_client.get_object(Bucket=bucket, Key=s.signature_r2_key)
                    media_cache[s.signature_r2_key] = obj["Body"].read()
                except Exception:
                    pass
    except Exception as e:
        print(f"[WARN] Fetching R2 media for MDB: {e}")

    mdb_bytes = generate_mdb_bytes(students, media_cache)

    tag = f"_{program}_{section}" if (program and section) else (f"_{program}" if program else "")
    filename = f"CardFive_Export{tag}_{datetime.now().strftime('%Y-%m-%d')}.mdb"

    return StreamingResponse(
        io.BytesIO(mdb_bytes),
        media_type="application/x-msaccess",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

