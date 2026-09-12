from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

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

    class Config:
        populate_by_name = True

def transform_student_to_mdb_csv(student: Any) -> MDBCsvExportSchema:
    """
    Transforms a Student SQLAlchemy model instance into the MDB CSV Export format.
    All text fields are forced to UPPERCASE to maintain strict legacy compatibility.
    """
    
    def to_upper(val: str | None) -> str:
        return val.upper() if val else ""

    # Map Year Level Integer to MDB Academic Level String
    # Reference: 1 -> 50, 2 -> 51 (Assumption based on legacy, adjust if needed)
    year_map = {
        1: "50",
        2: "51",
        3: "52",
        4: "53",
        5: "54"
    }
    
    acad_level = ""
    prog_code = ""
    if student.section:
        acad_level = year_map.get(student.section.year_level, "")
        if student.section.course:
            prog_code = to_upper(student.section.course.code)
    
    return MDBCsvExportSchema(
        STUDNO=to_upper(student.student_number),
        LASTNAME=to_upper(student.last_name),
        GENDER=to_upper(student.gender),
        MDLENAME=to_upper(student.middle_name),
        BRTHPLCE="", # Legacy didn't collect
        ADMSYEAR="", # Legacy didn't collect
        FRSTNAME=to_upper(student.first_name),
        BRTHDATE=student.birth_date.strftime("%m/%d/%Y") if student.birth_date else "",
        EMAILADR=to_upper(student.email),
        MPHNNMBR="", # Legacy didn't collect mobile phone in personal details
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
        ACADLEVL=acad_level
    )
