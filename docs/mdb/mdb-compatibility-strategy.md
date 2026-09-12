# MDB Compatibility Strategy

Microsoft Access MDB schema and workflow compatibility is a **hard requirement** for CSV export. The MDB is a **compatibility contract reference** — not the canonical application schema.

## Reference Artifact

| Item | Location | Rules |
|------|----------|-------|
| Sample MDB | `reference/mdb/sample.mdb` | Local only; gitignored; read-only analysis |

See also: [reference/mdb/README.md](../../reference/mdb/README.md)

## Core Principle

```
Canonical Model → Export Mapping / Transformation → MDB-compatible CSV
```

Do **not** assume:

```
new database column = MDB column = CSV column
```

The internal application model must remain decoupled from MDB representation through explicit mapping layers.

## What Must Be Preserved

| Behavior | Status |
|----------|--------|
| CSV importable into existing MDB workflow | VERIFIED hard requirement |
| Binary photo fields display as "Long Binary Data" in Access | VERIFIED |
| Binary signature fields display as "Long Binary Data" in Access | VERIFIED |
| Export column contract stable and documented | TBD — after analysis |

## MDB Analysis Plan

When `reference/mdb/sample.mdb` is present, inspect (read-only) and document:

- [x] Tables
- [x] Columns/fields, data types, sizes
- [x] Primary keys, foreign keys, relationships
- [x] Indexes (if available)
- [x] Nullability, defaults
- [x] Binary fields (photo, signature)
- [x] Naming conventions
- [x] Access-specific behaviors
- [x] Sample data patterns (sanitized notes)

**Outputs:**

- `docs/mdb/mdb-schema.md`
- `docs/mdb/mdb-data-patterns.md`

## Export Compatibility Contract (Future)

After canonical model and MDB analysis, define an explicit contract specifying:

1. CSV column order and headers
2. Data type formatting per column
3. Encoding (REQUIRES VERIFICATION)
4. Binary field representation in CSV (**REQUIRES HUMAN CONFIRMATION**)
5. Null/empty value conventions
6. Date/time formats
7. Text field length limits and truncation rules
8. Versioning strategy for contract changes

Contract document location (future): `docs/exports/mdb-csv-contract.md`

## Binary Field Investigation

**Status: OPEN INVESTIGATION**

MDB photo/signature fields contain binary data displayed as "Long Binary Data" in Microsoft Access. The eventual solution must account for:

- How legacy system currently exports binary data to CSV (if at all)
- How the MDB workflow imports CSV back into Access
- Whether CSV carries binary encoding, file paths, or separate import steps
- Whether photos/signatures are re-imported separately

**Do not prematurely decide CSV binary representation.**

Document findings in `docs/mdb/binary-field-investigation.md` during analysis phase.

## Relationship to Other Export Formats

The same canonical data supports all mandatory formats:

```
Canonical Model
    ├── CSV (MDB-compatible) — hard compatibility requirement
    ├── XLSX — explicit contract (may differ from CSV column layout)
    └── PDF — presentation layout (not MDB-shaped)
```

XLSX and PDF contracts are separate from MDB CSV but sourced from the same canonical model.

## Testing Strategy (Future)

When export layer exists:

- [ ] CSV round-trip test against MDB workflow (REQUIRES VERIFICATION of test procedure)
- [ ] Column-level contract tests
- [ ] Binary field compatibility tests
- [ ] Regression tests on contract version changes

## Forbidden

- Using MDB schema as canonical application schema
- Committing reference MDB to Git
- Modifying reference MDB
- Guessing binary CSV encoding without investigation

## Human Approval Required

- Final CSV/MDB compatibility contract
- Binary field representation decision
- Any breaking change to export contract version
