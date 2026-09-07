# Reference MDB

This directory holds **local reference Microsoft Access database files** for schema and compatibility analysis.

## Files

| File | Status | Git |
|------|--------|-----|
| `sample.mdb` | May exist locally | **Never commit** — gitignored |

## Rules

- **Reference artifact only** — not the application database
- **Do not modify** or overwrite the reference file
- **Do not commit** `*.mdb` or `*.accdb` to Git
- **Do not generate** application data from this file
- **Do not use** as runtime database for the new system

## Purpose

Support analysis of:

- MDB table and column structure
- Data types, keys, relationships, indexes
- Binary photo and signature fields
- Access-specific behavior ("Long Binary Data" display)
- Export/import compatibility expectations

## Analysis Outputs

Findings go in documentation — not in this directory:

- `docs/mdb/mdb-schema.md`
- `docs/mdb/mdb-data-patterns.md`
- `docs/database/mapping-matrix.md`

See [MDB Compatibility Strategy](../../docs/mdb/mdb-compatibility-strategy.md).

## If the File Is Missing

MDB analysis phase requires the reference file. Obtain `sample.mdb` from the project owner and place it here locally. Do not commit it.
