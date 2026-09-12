# MDB Data Patterns

Based on the sampling of records from `reference/mdb/sample.mdb`, the following patterns were observed:

## Address Fields
Despite the schema having granular address fields (e.g., `PERMBLDG`, `PERMCITY`, `PERMPOST`), most of these are left completely blank.
The full address is simply dumped into:
- `PERMSTRT` (Permanent Street) for the student's residential address.
- `CTCTSTRT` (Contact Street) for the emergency contact person's address.

Example `PERMSTRT`: `ZONE 1 DULO, ILAYA, BRGY. MALABAN, BIÑAN CITY, LAGUNA`

## Empty/Unused Fields
Many fields in `STDNTINFO` are entirely empty or unused in practice:
- `GENDER`, `BRTHPLCE`, `ADMSYEAR`, `EMAILADR`, `MPHNNMBR`, `PHNENMBR`, `RCRDDATE`.
This indicates that the MDB serves as a highly specific destination for a subset of the data, likely for printing ID cards.

## Date Formatting
`BRTHDATE` is stored as a string (Text/255) in the format `MM/DD/YYYY` (e.g., `10/20/2005`).

## Relationship to Legacy CSV Export
The legacy application's CSV export produces a `RES_ADDRESS` column which maps into this `PERMSTRT` field. It also produces `CONTACT_PERSON_ADDRESS` which maps to `CTCTSTRT`.

## Naming Conventions
- Fields are generally 8 characters or fewer (e.g., `FRSTNAME`, `MDLENAME`, `LASTNAME`, `CTCTPRSN`).
- All text strings are fully uppercase (as enforced by the legacy CSV export logic).
