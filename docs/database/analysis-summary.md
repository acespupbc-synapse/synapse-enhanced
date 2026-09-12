# Database Analysis Summary

## Overview
This document summarizes the findings from the Legacy System Analysis and the Microsoft Access MDB Analysis phases. The goal of this analysis was to understand the legacy data structures, the MDB contract requirements, and resolve any discrepancies before designing the Canonical Data Model for ACES Synapse Enhanced.

## Key Findings

1. **Denormalized vs Normalized Data**:
   - The legacy `Student` table relies heavily on string fields (e.g., `course`, `year_level`, `section`) rather than foreign keys to configuration tables.
   - The MDB structure uses internal codes (e.g., `ACADLEVL` '50' for 1st Year) requiring transformation mapping from the raw string inputs.

2. **Address Handling**:
   - The legacy system uses two simple string fields: `residential_address` and `emergency_address`.
   - The MDB has highly granular address fields (e.g., `PERMBLDG`, `PERMCITY`, `PERMPOST`), but in practice, they are left blank. Instead, the full address is dumped into `PERMSTRT` (Permanent Street) and `CTCTSTRT` (Contact Street).
   - **Decision**: The new canonical model only needs simple full-string address fields, mapping them to `PERMSTRT` and `CTCTSTRT` during CSV export.

3. **Binary Fields (Photos & Signatures)**:
   - **Investigation**: MDB contains `PICTURE` and `SIGNATURE` as OLE Objects, but the legacy CSV export did not include them.
   - **Resolution**: Confirmed by USER that photos are attached manually via CardFive. Therefore, the CSV export does not need to handle binary encoding. The system will only store photos as files.

4. **Missing Concepts in MDB**:
   - `Section`, `Validity Status`, and `Academic Year` are crucial for the application logic and grouping but do not exist in the MDB schema. They will exist in the canonical model but will not be exported to MDB.

5. **Student ID Generation**:
   - IDs (e.g., `2025-00416-BN-0`) are currently manually entered by the student/admin. It is not an auto-incrementing backend sequence.

## Next Steps
The analysis phase is complete. The next phase will use these findings (and the `mapping-matrix.md`) to design the:
1. **Canonical Data Model**: The source-of-truth schema for the new application.
2. **Data Contracts**: The definitive rules for exporting the canonical data into the required CSV format.
