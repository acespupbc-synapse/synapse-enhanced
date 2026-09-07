# Mapping Matrix Template

Template for the mapping/discrepancy matrix produced during database analysis. **Do not populate with guessed values.** Copy to `mapping-matrix.md` when analysis begins.

## Instructions

One row per logical field or entity attribute. Use status codes:

- `SHARED` — present in legacy and MDB with compatible meaning
- `LEGACY_ONLY` — only in legacy schema
- `MDB_ONLY` — only in MDB schema
- `REQUIRES TRANSFORM` — present in both but needs conversion
- `REQUIRES SPLIT` — single field should become multiple
- `REQUIRES CONCAT` — multiple fields should merge (rare — justify)
- `DEPRECATED` — should not carry forward
- `AMBIGUOUS` — REQUIRES HUMAN CONFIRMATION
- `TBD` — not yet analyzed

## Entity: TBD

| Logical Field | Stated Requirement | Legacy Location | Legacy Type/Size | MDB Location | MDB Type/Size | Canonical (TBD) | Status | Notes |
|---------------|-------------------|-----------------|------------------|--------------|---------------|-----------------|--------|-------|
| _example_ | R-REG-10 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | TBD | Remove example row when populating |

## Entity: Personal Address (placeholder)

| Logical Field | Stated Requirement | Legacy Location | MDB Location | Status | Notes |
|---------------|-------------------|-----------------|--------------|--------|-------|
| _TBD_ | R-DATA-03 | TBD | TBD | TBD | Separate from contact person address |

## Entity: Contact Person Address (placeholder)

| Logical Field | Stated Requirement | Legacy Location | MDB Location | Status | Notes |
|---------------|-------------------|-----------------|--------------|--------|-------|
| _TBD_ | R-DATA-03 | TBD | TBD | TBD | Separate from personal address |

## Media Fields

| Logical Field | Stated Requirement | Legacy Storage | MDB Field | CSV Export | Status | Notes |
|---------------|-------------------|----------------|-----------|------------|--------|-------|
| Student photo | R-MED-01 | TBD | TBD | TBD | TBD | JPG 1500×1500; MDB Long Binary Data |
| Student signature | R-MED-02 | TBD | TBD | TBD | TBD | JPG 2000×1200; admin upload |

## Summary Counts (fill after analysis)

| Category | Count |
|----------|-------|
| Shared fields | TBD |
| Legacy-only fields | TBD |
| MDB-only fields | TBD |
| Requires transformation | TBD |
| Ambiguous / human confirmation | TBD |
| Deprecated | TBD |

## Human Confirmation Log

| Item | Question | Decision | Date | Decided By |
|------|----------|----------|------|------------|
| _TBD_ | | | | |
