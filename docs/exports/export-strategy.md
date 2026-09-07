# Export Strategy

Strategy for PDF, XLSX, and CSV exports. All three formats are **mandatory**. No export implementation exists yet.

## Requirements (Verified)

| Format | Required | Notes |
|--------|----------|-------|
| CSV | Yes | Must be compatible with existing MDB workflow |
| XLSX | Yes | Explicit contract |
| PDF | Yes | Explicit contract |

Exports must be generated according to an **explicit export contract** — not ad-hoc representations of database tables.

## Architectural Approach

```
┌──────────────────┐
│  Canonical Model │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Export Service  │  ← domain queries, authorization, filtering
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Export Contract  │  ← versioned field definitions, transforms
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
  CSV  XLSX  PDF
```

Each format has its own renderer/transformer driven by the shared contract (or format-specific extensions of it).

## Export Contract (Future Document)

The contract will define:

- Field identifiers (canonical names)
- Output column headers per format
- Data type formatting rules
- Transformations (dates, enums, concatenations)
- Media field handling (photo/signature)
- Filtering scope (academic year, status, etc.)
- Contract version

Location (future): `docs/exports/export-contract.md`

## CSV / MDB Compatibility

CSV is special: it must satisfy the MDB workflow hard requirement.

See [MDB Compatibility Strategy](../mdb/mdb-compatibility-strategy.md).

Key open item: **binary photo/signature representation in CSV** — REQUIRES HUMAN CONFIRMATION after investigation.

## XLSX Strategy

- Structured tabular export aligned with admin reporting needs
- May include columns not present in MDB CSV (REQUIRES VERIFICATION)
- Explicit column contract — not raw DB dump
- Media fields: likely references or embedded images (TBD)

## PDF Strategy

- Presentation-oriented layout (student records, registration lists, ID cards, etc.)
- Specific PDF templates: TBD after UX and requirements review
- Likely use cases: individual student record, bulk registration report
- Media: embedded images where appropriate (TBD)

## Authorization

Export operations are administrative functions:

- Must be server-side authorized
- Students must not access bulk export endpoints
- Export scope and audit logging: TBD

## Filtering and Scope

Admin exports will likely support:

- Academic year grouping (VERIFIED requirement for admin views)
- Search/filter criteria matching admin panel (REQUIRES VERIFICATION for export parity)

Exact export filter API: TBD.

## Versioning

Export contracts should be versioned. Breaking changes require:

- Human approval
- Migration notes
- Updated compatibility tests

## Testing (Future)

| Test Type | Purpose |
|-----------|---------|
| Contract unit tests | Each field maps correctly |
| CSV MDB compatibility | Round-trip or import validation |
| XLSX structure tests | Headers, types, row counts |
| PDF snapshot/layout tests | Template rendering |
| Authorization tests | Unauthorized export blocked |
| Regression tests | Contract version stability |

See [Testing Strategy](../testing/testing-strategy.md).

## Phase Gate

Export contract design begins after:

1. Canonical data model approved
2. MDB schema analysis complete
3. Legacy export behavior documented
4. Binary field investigation complete (for CSV)

## Not In Scope Now

- Choosing PDF/XLSX libraries
- Implementing export endpoints
- Defining final column lists
