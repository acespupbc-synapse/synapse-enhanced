"""
app/core/mdb_generator.py — Generates Microsoft Access .MDB files with LONGBINARY photo/signature support
Matches sample.mdb / CardFive schema (STDNTINFO, ACADINFO, PRGRMINFO tables).

Supports dual execution backends:
1. Windows: Native Microsoft Access ODBC Driver via pyodbc (when available).
2. Linux (Render / Cloud): Jackcess via standalone mdb-writer.jar and headless JRE.
"""
import logging
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

# Paths
TEMPLATE_MDB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "templates", "template.mdb"
)
MDB_WRITER_JAR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "tools", "mdb-writer.jar"
)
LINUX_JRE_DIR = "/tmp/synapse_jre"
TEMURIN_LINUX_JRE_URL = (
    "https://github.com/adoptium/temurin17-binaries/releases/download/"
    "jdk-17.0.10%2B7/OpenJDK17U-jre_x64_linux_hotspot_17.0.10_7.tar.gz"
)


def is_mdb_driver_available() -> bool:
    """Check if Microsoft Access ODBC driver is available on the host system."""
    try:
        import pyodbc
        drivers = pyodbc.drivers()
        return any("Microsoft Access Driver" in d for d in drivers)
    except Exception:
        return False


def _find_java_in_dir(search_dir: str) -> Optional[str]:
    """Recursively find java binary in a directory and ensure executable bit."""
    if not os.path.exists(search_dir):
        return None
    for root, _dirs, files in os.walk(search_dir):
        target = "java.exe" if sys.platform == "win32" else "java"
        if target in files:
            java_path = os.path.join(root, target)
            if sys.platform != "win32":
                try:
                    os.chmod(java_path, 0o755)
                except Exception:
                    pass
            return java_path
    return None


def get_java_executable() -> Optional[str]:
    """Find a usable Java executable on the host system."""
    # 1. System PATH
    cmd = shutil.which("java")
    if cmd:
        return cmd

    # 2. Local project JRE directory (if any)
    bundled_jre = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tools", "jre")
    found = _find_java_in_dir(bundled_jre)
    if found:
        return found

    # 3. Cached Linux JRE in /tmp
    if sys.platform != "win32":
        found = _find_java_in_dir(LINUX_JRE_DIR)
        if found:
            return found

    return None


def ensure_linux_jre() -> Optional[str]:
    """
    On Linux, ensure a headless JRE exists. If not present, downloads
    Eclipse Temurin 17 JRE headless (~45MB) to LINUX_JRE_DIR.
    """
    existing = get_java_executable()
    if existing:
        return existing

    if sys.platform == "win32":
        return None

    try:
        os.makedirs(LINUX_JRE_DIR, exist_ok=True)
        tar_path = os.path.join("/tmp", "temurin_jre.tar.gz")

        print(f"[MDB Engine] Downloading Linux JRE from {TEMURIN_LINUX_JRE_URL}...")
        req = urllib.request.Request(
            TEMURIN_LINUX_JRE_URL,
            headers={"User-Agent": "ACES-Synapse-MDB-Engine/2.2"}
        )
        with urllib.request.urlopen(req) as resp, open(tar_path, "wb") as out_file:
            shutil.copyfileobj(resp, out_file)

        print("[MDB Engine] Extracting Linux JRE...")
        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(path=LINUX_JRE_DIR)

        if os.path.exists(tar_path):
            try:
                os.remove(tar_path)
            except Exception:
                pass

        java_bin = _find_java_in_dir(LINUX_JRE_DIR)
        if java_bin:
            print(f"[MDB Engine] Linux JRE ready at: {java_bin}")
            return java_bin
        else:
            print("[WARN] JRE extracted but java binary not found.")
            return None
    except Exception as e:
        print(f"[WARN] Failed to setup Linux JRE: {e}")
        return None


def generate_mdb_bytes_jackcess(
    students,
    media_cache: Optional[dict[str, bytes]] = None,
    java_cmd: Optional[str] = None
) -> bytes:
    """Populate MDB via Jackcess mdb-writer.jar."""
    if not java_cmd:
        java_cmd = get_java_executable() or ensure_linux_jre()
    if not java_cmd or not os.path.exists(MDB_WRITER_JAR):
        raise RuntimeError("Java or mdb-writer.jar not available for Jackcess MDB generation.")

    cache = media_cache or {}

    with tempfile.TemporaryDirectory() as tmp_dir:
        photos_dir = os.path.join(tmp_dir, "photos")
        sigs_dir = os.path.join(tmp_dir, "signatures")
        os.makedirs(photos_dir, exist_ok=True)
        os.makedirs(sigs_dir, exist_ok=True)

        tsv_path = os.path.join(tmp_dir, "records.tsv")
        out_mdb = os.path.join(tmp_dir, "output.mdb")

        headers = [
            "STUDNO", "LASTNAME", "FRSTNAME", "MDLENAME", "GENDER",
            "BRTHDATE", "EMAILADR", "PROGCODE", "ACADLEVL", "PERMSTRT",
            "CTCTPRSN", "CTCTNMBR", "CTCTSTRT", "PICTURE_FILE", "SIGNATURE_FILE"
        ]
        lines = ["\t".join(headers)]

        for i, s in enumerate(students):
            pic_rel = ""
            if s.photo_r2_key and s.photo_r2_key in cache:
                pic_name = f"photo_{i}.jpg"
                with open(os.path.join(photos_dir, pic_name), "wb") as pf:
                    pf.write(cache[s.photo_r2_key])
                pic_rel = f"photos/{pic_name}"

            sig_rel = ""
            if s.signature_r2_key and s.signature_r2_key in cache:
                sig_name = f"sig_{i}.jpg"
                with open(os.path.join(sigs_dir, sig_name), "wb") as sf:
                    sf.write(cache[s.signature_r2_key])
                sig_rel = f"signatures/{sig_name}"

            raw_prog = (s.course.code or "") if s.course else ""
            prog_code = "BSP" if raw_prog.strip().upper() in ("BSPSY", "BSP") else raw_prog.strip().upper()

            row = [
                s.student_number or "",
                (s.last_name or "").upper(),
                (s.first_name or "").upper(),
                (s.middle_name or "").upper() if s.middle_name else "",
                s.gender or "",
                s.birth_date.strftime("%m/%d/%Y") if s.birth_date else "",
                s.email or "",
                prog_code,
                "50",
                s.perm_strt or "",
                s.contact_person_name or "",
                s.contact_person_number or "",
                s.contact_strt or s.perm_strt or "",
                pic_rel,
                sig_rel,
            ]
            lines.append("\t".join(row))

        with open(tsv_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        cmd = [java_cmd, "-Xmx192m", "-jar", MDB_WRITER_JAR, TEMPLATE_MDB_PATH, tsv_path, out_mdb]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Jackcess mdb-writer failed: {res.stderr or res.stdout}")

        with open(out_mdb, "rb") as f:
            return f.read()


def generate_mdb_bytes_pyodbc(students, media_cache: Optional[dict[str, bytes]] = None) -> bytes:
    """Populate MDB via Windows ODBC pyodbc."""
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
            photo_bytes = cache.get(s.photo_r2_key) if s.photo_r2_key else None
            sig_bytes = cache.get(s.signature_r2_key) if s.signature_r2_key else None

            pic_param = pyodbc.Binary(photo_bytes) if photo_bytes else None
            sig_param = pyodbc.Binary(sig_bytes) if sig_bytes else None

            raw_prog = (s.course.code or "") if s.course else ""
            prog_code = "BSP" if raw_prog.strip().upper() in ("BSPSY", "BSP") else raw_prog.strip().upper()

            cur.execute(insert_sql, (
                s.student_number or "",
                (s.last_name or "").upper(),
                (s.first_name or "").upper(),
                (s.middle_name or "").upper() if s.middle_name else "",
                s.gender or "",
                s.birth_date.strftime("%m/%d/%Y") if s.birth_date else "",
                s.email or "",
                prog_code,
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


def generate_mdb_bytes(students, media_cache: Optional[dict[str, bytes]] = None) -> bytes:
    """
    Main entry point: generates MDB bytes populated with students, photos, signatures,
    and the ACADINFO/PRGRMINFO reference tables.
    """
    if not os.path.exists(TEMPLATE_MDB_PATH):
        raise FileNotFoundError(f"Template MDB not found at {TEMPLATE_MDB_PATH}")

    # 1. Try Windows ODBC if driver available
    if is_mdb_driver_available():
        try:
            return generate_mdb_bytes_pyodbc(students, media_cache)
        except Exception as e:
            print(f"[WARN] PyODBC MDB generation failed: {e}")

    # 2. Try Jackcess (Linux / Cloud or Windows fallback)
    java_bin = get_java_executable() or (ensure_linux_jre() if sys.platform != "win32" else None)
    if java_bin and os.path.exists(MDB_WRITER_JAR):
        try:
            return generate_mdb_bytes_jackcess(students, media_cache, java_bin)
        except Exception as e:
            print(f"[WARN] Jackcess MDB generation failed: {e}")

    # 3. Safe fallback: return template MDB with ACADINFO and PRGRMINFO baked in
    print("[WARN] Neither ODBC nor Jackcess available. Returning template MDB with reference tables.")
    with open(TEMPLATE_MDB_PATH, "rb") as f:
        return f.read()
