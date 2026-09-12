# Binary Field Investigation (MDB)

## Status: RESOLVED

### Observations
1. In the MS Access MDB (`reference/mdb/sample.mdb`), the fields `PICTURE` and `SIGNATURE` are defined as `OLE Object` (Type 205 - adLongVarBinary).
2. The legacy Python system's CSV export mechanism **does not include photos or signatures**. It only exports text fields like names and addresses.
3. The legacy system saves photos as raw files (e.g., `.jpg` or `.png`) on the filesystem (`static/uploads/photos/...`).

### Resolution
- The administration team uses a separate software called **CardFive** to manually attach the JPG photos into the MDB file.
- Therefore, the CSV export **does not need** to handle binary data or image encoding. It only needs to provide the textual data required by the MDB schema.
- The new system will maintain the pattern of securely storing photos on the filesystem (or cloud storage) and will not attempt to encode images into the CSV export.
