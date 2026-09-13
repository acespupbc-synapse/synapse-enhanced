"""
app/core/mdb_generator.py — Generates Microsoft Access .MDB files with LONGBINARY photo/signature support
Matches sample.mdb / CardFive schema (STDNTINFO table).
"""
import os
import shutil
import tempfile
from typing import Optional

# Path to clean template MDB
TEMPLATE_MDB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "templates", "template.mdb"
)


def is_mdb_driver_available() -> bool:
    """Check if Microsoft Access ODBC driver is available on the host system."""
    try:
        import pyodbc
        drivers = pyodbc.drivers()
        return any("Microsoft Access Driver" in d for d in drivers)
    except Exception:
        return False


def generate_mdb_bytes(students, media_cache: Optional[dict[str, bytes]] = None) -> bytes:
    """
    Populate a clone of the template MDB with student records.
    Converts photos and signatures into Long Binary Data (OLE Object) via pyodbc.Binary.
    If the Access ODBC driver is unavailable, returns the clean template.mdb bytes as a safe fallback.
    """
    if not os.path.exists(TEMPLATE_MDB_PATH):
        raise FileNotFoundError(f"Template MDB not found at {TEMPLATE_MDB_PATH}")

    if not is_mdb_driver_available():
        print("[WARN] Microsoft Access Driver not available on this platform. Returning template MDB.")
        with open(TEMPLATE_MDB_PATH, "rb") as f:
            return f.read()

    import pyodbc

    cache = media_cache or {}

    with tempfile.NamedTemporaryFile(suffix=".mdb", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        shutil.copyfile(TEMPLATE_MDB_PATH, tmp_path)

        conn_str = f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={tmp_path};"
        conn = pyodbc.connect(conn_str)
        cur = conn.cursor()

        insert_sql = """
            INSERT INTO STDNTINFO (
                STUDNO, LASTNAME, FRSTNAME, MDLENAME, GENDER, BRTHDATE, EMAILADR,
                PROGCODE, ACADLEVL, PERMSTRT, CTCTPRSN, CTCTNMBR, CTCTSTRT,
                PICTURE, SIGNATURE
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?
            )
        """

        for s in students:
            # Resolve photos and signatures
            photo_bytes = cache.get(s.photo_r2_key) if s.photo_r2_key else None
            sig_bytes = cache.get(s.signature_r2_key) if s.signature_r2_key else None

            pic_param = pyodbc.Binary(photo_bytes) if photo_bytes else None
            sig_param = pyodbc.Binary(sig_bytes) if sig_bytes else None

            cur.execute(insert_sql, (
                s.student_number or "",
                (s.last_name or "").upper(),
                (s.first_name or "").upper(),
                (s.middle_name or "").upper() if s.middle_name else "",
                s.gender or "",
                s.birth_date.strftime("%m/%d/%Y") if s.birth_date else "",
                s.email or "",
                s.course.code if s.course else "",
                "50",
                s.perm_strt or "",
                s.contact_person_name or "",
                s.contact_person_number or "",
                s.contact_strt or s.perm_strt or "",
                pic_param,
                sig_param
            ))

        conn.commit()
        conn.close()

        with open(tmp_path, "rb") as f:
            data = f.read()
        return data

    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
