"""
app/schemas/export.py — MDB CSV Export Schema + transform function

This is the official MDB-compatibility export contract for CardFive.
All fields match the STDNTINFO table in sample.mdb.
"""
from typing import Optional, Any
from pydantic import BaseModel


class MDBCsvExportSchema(BaseModel):
    """
    Pydantic schema representing the exact CSV export structure required for the
    Microsoft Access MDB (STDNTINFO table) workflow.
    """
    STUDNO: str
    LASTNAME: str
    GENDER: str
    MDLENAME: str
    BRTHPLCE: str
    ADMSYEAR: str
    FRSTNAME: str
    BRTHDATE: str
    EMAILADR: str
    MPHNNMBR: str
    PERMBLDG: str
    PROGCODE: str
    PERMDSTR: str
    PERMCITY: str
    PERMSTAD: str
    PERMCTRY: str
    PERMPOST: str
    PHNENMBR: str
    PERMSTRT: str
    CTCTPRSN: str
    CTCTBLDG: str
    CTCTDSTR: str
    CTCTCITY: str
    CTCTSTAD: str
    CTCTPOST: str
    CPHNNMBR: str
    CTCTSTRT: str
    RCRDDATE: str
    CTCTNMBR: str
    ACADLEVL: str

    model_config = {"populate_by_name": True}


def transform_student_to_mdb_csv(student: Any) -> MDBCsvExportSchema:
    """
    Transforms a Student SQLAlchemy model instance into the MDB CSV Export format.
    All text fields are forced to UPPERCASE to maintain strict legacy compatibility.

    NOTE: Assumes section and course are eagerly loaded (selectinload) before calling.
    """

    def to_upper(val: Optional[str]) -> str:
        return val.upper() if val else ""

    # Map Year Level integer to MDB Academic Level string
    # Legacy mapping: 1st Year = 50, 2nd = 51, 3rd = 52, 4th = 53
    year_map = {1: "50", 2: "51", 3: "52", 4: "53", 5: "54"}

    acad_level = ""
    prog_code = ""
    if student.section:
        acad_level = year_map.get(student.section.year_level, "")
    if student.course:
        raw_code = to_upper(student.course.code)
        prog_code = "BSP" if raw_code in ("BSPSY", "BSP") else raw_code

    return MDBCsvExportSchema(
        STUDNO=to_upper(student.student_number),
        LASTNAME=to_upper(student.last_name),
        GENDER=to_upper(student.gender),
        MDLENAME=to_upper(student.middle_name),
        BRTHPLCE="",  # Not collected in canonical model
        ADMSYEAR="",  # Not collected in canonical model
        FRSTNAME=to_upper(student.first_name),
        BRTHDATE=student.birth_date.strftime("%m/%d/%Y") if student.birth_date else "",
        EMAILADR=to_upper(student.email),
        MPHNNMBR="",  # Not collected (mobile in personal detail section — TBD)
        PERMBLDG=to_upper(student.perm_bldg),
        PROGCODE=prog_code,
        PERMDSTR=to_upper(student.perm_dstr),
        PERMCITY=to_upper(student.perm_city),
        PERMSTAD=to_upper(student.perm_stad),
        PERMCTRY=to_upper(student.perm_ctry),
        PERMPOST=to_upper(student.perm_post),
        PHNENMBR=to_upper(student.contact_person_number3),
        PERMSTRT=to_upper(student.perm_strt),
        CTCTPRSN=to_upper(student.contact_person_name),
        CTCTBLDG=to_upper(student.contact_bldg),
        CTCTDSTR=to_upper(student.contact_dstr),
        CTCTCITY=to_upper(student.contact_city),
        CTCTSTAD=to_upper(student.contact_stad),
        CTCTPOST=to_upper(student.contact_post),
        CPHNNMBR=to_upper(student.contact_person_number2),
        CTCTSTRT=to_upper(student.contact_strt),
        RCRDDATE=student.created_at.strftime("%m/%d/%Y") if student.created_at else "",
        CTCTNMBR=to_upper(student.contact_person_number),
        ACADLEVL=acad_level,
    )
