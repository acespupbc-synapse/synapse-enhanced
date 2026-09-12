# Legacy Exports

## CSV Export Behavior
- Triggered via `/export_csv_filtered` route.
- Can filter by year, section, or course.
- **Columns**: 
  1. `STUDNO`
  2. `LASTNAME`
  3. `MDLENAME`
  4. `FRSTNAME`
  5. `PROGCODE`
  6. `YRLVL`
  7. `SEC`
  8. `BRTHDATE` (Format: MM/DD/YYYY)
  9. `RES_ADDRESS`
  10. `CONTACT_PERSON`
  11. `CONTACT_PERSON_ADDRESS`
  12. `CONTACT_PERSON_NUMBER`
  13. `FNMI` (First Name + Middle Initial)
- **Formatting**: Text is forced to uppercase.
- **MDB Integration**: No direct MDB integration in Python code; presumably, this CSV is imported into Access manually.
- No XLSX or PDF export implementation found in the repository.
- Photos/signatures are not included in the CSV export.
