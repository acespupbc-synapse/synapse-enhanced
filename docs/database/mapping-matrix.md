# Mapping Matrix

This document tracks the mapping between the legacy SQLite application schema and the Microsoft Access MDB contract schema, which informs the future canonical model.

## Status Codes

- `SHARED` — present in legacy and MDB with compatible meaning
- `LEGACY_ONLY` — only in legacy schema
- `MDB_ONLY` — only in MDB schema
- `REQUIRES TRANSFORM` — present in both but needs conversion
- `REQUIRES SPLIT` — single field should become multiple
- `REQUIRES CONCAT` — multiple fields should merge (rare — justify)
- `DEPRECATED` — should not carry forward
- `AMBIGUOUS` — REQUIRES HUMAN CONFIRMATION
- `TBD` — not yet analyzed

## Entity: Student Record

| Logical Field | Stated Requirement | Legacy Location | Legacy Type/Size | MDB Location | MDB Type/Size | Canonical (TBD) | Status | Notes |
|---------------|--------------------|-----------------|------------------|--------------|---------------|-----------------|--------|-------|
| Student Number| - | `student_number` | Text(20) | `STUDNO` | Text(255) | TBD | SHARED | Primary identifier in business logic |
| First Name | - | `first_name` | Text(50) | `FRSTNAME` | Text(255) | TBD | SHARED | Forced uppercase in export |
| Middle Name | - | `middle_name` | Text(50) | `MDLENAME` | Text(255) | TBD | SHARED | Optional in legacy |
| Last Name | - | `last_name` | Text(50) | `LASTNAME` | Text(255) | TBD | SHARED | Forced uppercase in export |
| Course/Program| - | `course` | Text(100) | `PROGCODE` | Text(255) | TBD | SHARED | Legacy stores raw string (e.g. BSCpE) |
| Year Level | - | `year_level` | Text(50) | `ACADLEVL` | Text(5) | TBD | REQUIRES TRANSFORM | Legacy stores '1ST YEAR', MDB stores '50' |
| Section | - | `section` | Text(50) | (None) | - | TBD | LEGACY_ONLY | Crucial for grouping but absent in MDB |
| Date of Birth | - | `birthdate` | Text(20) | `BRTHDATE` | Text(255) | TBD | REQUIRES TRANSFORM | DB format vs MM/DD/YYYY format in MDB |
| Email | - | `email` | Text(120) | `EMAILADR` | Text(255) | TBD | SHARED | Empty in MDB sample, but field exists |
| Organization | - | `organization` | Text(50) | (None) | - | TBD | LEGACY_ONLY | |
| Record Date | - | `created_at` | DateTime | `RCRDDATE` | Text(255) | TBD | REQUIRES TRANSFORM | Date formats differ |
| Gender | - | (None) | - | `GENDER` | Text(255) | TBD | MDB_ONLY | MDB field empty in practice |
| Birth Place | - | (None) | - | `BRTHPLCE` | Text(255) | TBD | MDB_ONLY | MDB field empty in practice |
| Admission Yr | - | (None) | - | `ADMSYEAR` | Text(255) | TBD | MDB_ONLY | MDB field empty in practice |
| Barcode | - | `barcode_filename`| Text(100) | (None) | - | TBD | DEPRECATED? | Unused file logic in legacy |
| Validity | - | `validity_status`| Text(20) | (None) | - | TBD | LEGACY_ONLY | e.g. "Pending" |
| Academic Year | - | `academic_year` | Text(20) | (None) | - | TBD | LEGACY_ONLY | Default "AY 25-26" |

## Entity: Personal Address

| Logical Field | Stated Requirement | Legacy Location | MDB Location | Status | Notes |
|---------------|--------------------|-----------------|--------------|--------|-------|
| Full Address | R-DATA-03 | `residential_address` | `PERMSTRT` | SHARED | Separate from contact person address |
| Bldg/House No | - | (None) | `PERMBLDG` | MDB_ONLY | Empty in MDB sample |
| District | - | (None) | `PERMDSTR` | MDB_ONLY | Empty in MDB sample |
| City | - | (None) | `PERMCITY` | MDB_ONLY | Empty in MDB sample |
| Province/State| - | (None) | `PERMSTAD` | MDB_ONLY | Empty in MDB sample |
| Country | - | (None) | `PERMCTRY` | MDB_ONLY | Empty in MDB sample |
| Postal Code | - | (None) | `PERMPOST` | MDB_ONLY | Empty in MDB sample |

## Entity: Contact Person Details

| Logical Field | Stated Requirement | Legacy Location | MDB Location | Status | Notes |
|---------------|--------------------|-----------------|--------------|--------|-------|
| Contact Name | - | `emergency_contact_name` | `CTCTPRSN` | SHARED | |
| Contact Num 1 | - | `emergency_contact_number`| `CTCTNMBR` | SHARED | Primary contact number |
| Contact Num 2 | - | (None) | `CPHNNMBR` | MDB_ONLY | Empty in MDB sample |
| Contact Num 3 | - | (None) | `PHNENMBR` | MDB_ONLY | Empty in MDB sample |
| Full Address | R-DATA-03 | `emergency_address` | `CTCTSTRT` | SHARED | Separate from personal address |
| Bldg/House No | - | (None) | `CTCTBLDG` | MDB_ONLY | Empty in MDB sample |
| District | - | (None) | `CTCTDSTR` | MDB_ONLY | Empty in MDB sample |
| City | - | (None) | `CTCTCITY` | MDB_ONLY | Empty in MDB sample |
| Province/State| - | (None) | `CTCTSTAD` | MDB_ONLY | Empty in MDB sample |
| Postal Code | - | (None) | `CTCTPOST` | MDB_ONLY | Empty in MDB sample |

## Media Fields

| Logical Field | Stated Requirement | Legacy Storage | MDB Field | CSV Export | Status | Notes |
|---------------|--------------------|----------------|-----------|------------|--------|-------|
| Student photo | R-MED-01 | File system path `photo_filename` | `PICTURE` (OLE) | Excluded | SHARED (via CardFive) | CardFive handles MDB binary injection manually |
| Signature | R-MED-02 | (None) | `SIGNATURE` (OLE) | Excluded | MDB_ONLY | Legacy did not handle signatures |

## Summary Counts

| Category | Count |
|----------|-------|
| Shared fields | 12 |
| Legacy-only fields | 4 |
| MDB-only fields | 15 |
| Requires transformation | 3 |
| Ambiguous / human confirmation | 0 |
| Deprecated | 1 |

## Human Confirmation Log

| Item | Question | Decision | Date | Decided By |
|------|----------|----------|------|------------|
| Binary Fields | How are photos inserted into MDB? | Admin uses CardFive software to manually attach JPGs to MDB. CSV does not need to handle blobs. | 2026-09-07 | USER |
