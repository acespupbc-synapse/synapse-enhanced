# MDB Schema Analysis

This document details the schema of the reference MDB file (`reference/mdb/sample.mdb`).

## Tables

### 1. `ACADINFO`
Stores academic levels/years.
- `ACADLEVL` (Text, length 5) - e.g., "50"
- `ACADLDSC` (Text, length 50)

### 2. `PRGRMINFO`
Stores programs/courses.
- `PROGCODE` (Text, length 20) - e.g., "BSCpE"
- `PROGTTLE` (Text, length 150)

### 3. `STDNTINFO`
Main table for student records.
- `RCRDN` (Integer/Long) - Record Number/ID
- `PICTURE` (OLE Object / Long Binary Data) - Image blob
- `SIGNATURE` (OLE Object / Long Binary Data) - Image blob
- `STUDNO` (Text, length 255)
- `LASTNAME` (Text, length 255)
- `GENDER` (Text, length 255)
- `MDLENAME` (Text, length 255)
- `BRTHPLCE` (Text, length 255)
- `ADMSYEAR` (Text, length 255)
- `FRSTNAME` (Text, length 255)
- `BRTHDATE` (Text, length 255)
- `EMAILADR` (Text, length 255)
- `MPHNNMBR` (Text, length 255)
- `PROGCODE` (Text, length 255)
- `ACADLEVL` (Text, length 5)

**Permanent Address Fields**
- `PERMBLDG` (Text, length 255)
- `PERMDSTR` (Text, length 255)
- `PERMCITY` (Text, length 255)
- `PERMSTAD` (Text, length 255)
- `PERMCTRY` (Text, length 255)
- `PERMPOST` (Text, length 255)
- `PERMSTRT` (Text, length 255)

**Contact Person Fields**
- `CTCTPRSN` (Text, length 255)
- `CTCTNMBR` (Text, length 255)
- `CPHNNMBR` (Text, length 255)
- `PHNENMBR` (Text, length 255)

**Contact Person Address Fields**
- `CTCTBLDG` (Text, length 255)
- `CTCTDSTR` (Text, length 255)
- `CTCTCITY` (Text, length 255)
- `CTCTSTAD` (Text, length 255)
- `CTCTPOST` (Text, length 255)
- `CTCTSTRT` (Text, length 255)

- `RCRDDATE` (Text, length 255)
