# Data Architecture — Three-Schema Distinction

This document defines how ACES Synapse Enhanced treats its three distinct data structures. **No canonical schema is defined here.**

## The Three Structures

| # | Structure | Role in Project |
|---|-----------|-----------------|
| 1 | Legacy Python application database schema | Migration source; behavioral reference |
| 2 | Microsoft Access MDB schema | Export compatibility contract reference |
| 3 | New application canonical data model | Future internal source of truth |

**These are not the same thing.** Conflating them is a primary risk in this modernization.

## Why They Differ

The legacy Python application's database schema differs from the MDB schema. This mismatch is a key driver for modernization — not an accident to paper over with 1:1 column mapping.

## Rules

1. Do **not** use the legacy Python schema as the canonical model.
2. Do **not** use the MDB schema as the canonical model.
3. Do **not** assume either schema is normalized or ideal.
4. Design the canonical model from **verified business semantics** and stated requirements.
5. Use explicit mapping layers for migration and export.

## Conceptual Flow

```
LEGACY SYSTEM
    |
    +--> Legacy application schema
    +--> Existing legacy data
    +--> Existing behavior
    |
    v
Legacy analysis / migration mapping
    |
    v
NEW CANONICAL DATA MODEL
    |
    +--> Student application
    +--> Admin application
    +--> Business logic
    +--> Export layer
    +--> Future import layer (TBD)


NEW CANONICAL DATA MODEL
    |
    v
MDB COMPATIBILITY / EXPORT MAPPING
    |
    +--> CSV (MDB-compatible)
    +--> XLSX
    +--> PDF
    +--> Future MDB-compatible workflows
```

## Address Entities (Verified Requirement)

Student **personal address** and **contact person address** are separate concepts:

- Must remain separate in UI
- Must remain separate in canonical model
- Legacy/MDB representation: **REQUIRES VERIFICATION** during analysis

Do not collapse into a generic address table without analysis.

## Media Fields

Photo and signature exist in multiple representations:

| Concern | Description | Status |
|---------|-------------|--------|
| Application storage | Secure private file storage | TBD |
| DB metadata | References, validation metadata | TBD |
| MDB binary | "Long Binary Data" in Access | VERIFIED behavior to preserve |
| CSV export | Binary encoding in CSV | REQUIRES HUMAN CONFIRMATION |

## Mapping / Discrepancy Matrix (Future Deliverable)

The analysis phase will produce a matrix identifying:

- Legacy-only fields
- MDB-only fields
- Shared fields
- Name mismatches
- Type/size mismatches
- Semantic mismatches
- Fields requiring transformation, splitting, concatenation, normalization
- Lookup/reference table candidates
- Fields that should NOT carry forward
- Binary/photo/signature fields
- Derived, deprecated, and ambiguous fields

Uncertain items → `TBD / REQUIRES HUMAN CONFIRMATION`

Template location: [mapping-matrix-template.md](./mapping-matrix-template.md)

## Phase Gate

Canonical schema design begins **only after**:

1. Legacy analysis complete
2. MDB analysis complete
3. Mapping matrix reviewed by human
4. Ambiguous items resolved or explicitly deferred
