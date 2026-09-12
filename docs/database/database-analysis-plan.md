# Database Analysis Plan

Structured plan for analyzing data structures **before** designing the canonical database schema. This phase produces documentation and matrices — **not** migrations or application schema.

## Objectives

1. Document the legacy Python application database schema
2. Document legacy application fields and workflows
3. Document the MDB schema and data patterns
4. Compare all sources against stated requirements
5. Produce a mapping/discrepancy matrix
6. Identify items requiring human confirmation

## Inputs

| Source | Location | Notes |
|--------|----------|-------|
| Legacy GitHub repo | https://github.com/JOBIJEEEB/pupbc_synapse | Schema, models, migrations, forms |
| Legacy live system | https://aces2026synapse.pythonanywhere.com/ | Behavioral observation (read-only) |
| Reference MDB | `reference/mdb/sample.mdb` (local, gitignored) | Compatibility contract reference |
| Stated requirements | `docs/requirements/` | Verified requirements only |

## Outputs

| Deliverable | Location | Status |
|-------------|----------|--------|
| Legacy schema documentation | `docs/legacy/legacy-schema.md` | DONE |
| Legacy workflow documentation | `docs/legacy/legacy-workflows.md` | DONE |
| MDB schema documentation | `docs/mdb/mdb-schema.md` | DONE |
| MDB data patterns | `docs/mdb/mdb-data-patterns.md` | DONE |
| Mapping / discrepancy matrix | `docs/database/mapping-matrix.md` | DONE |
| Analysis findings summary | `docs/database/analysis-summary.md` | DONE |

## Analysis Steps

### Phase 1: Legacy Python Schema

1. Clone/read legacy repository (do not modify)
2. Identify ORM models, raw SQL, migrations, or schema definitions
3. Document tables, columns, types, constraints, relationships
4. Note indexes, nullability, defaults where visible
5. Identify photo/signature field storage approach
6. Identify personal vs contact person address fields
7. Document academic year, course, section structures
8. Note soft-delete or trash behavior if present
9. Record validation rules from forms/serializers/views

### Phase 2: Legacy Application Behavior

1. Review registration workflow (steps, fields, validation messages)
2. Review admin panel capabilities
3. Review export behavior (CSV/XLSX/PDF if present)
4. Review student ID preview/generation
5. Review open/close registration mechanism
6. Review footer content and credentials display
7. Document edge cases and business rules observed in code or live site
8. **Do not** treat UI layout as binding for new design

### Phase 3: MDB Schema Analysis

1. Inspect `reference/mdb/sample.mdb` if present (read-only tools)
2. Document tables, columns, types, keys, relationships, indexes
3. Identify binary/photo/signature fields and Access-specific behavior
4. Note field sizes, nullability, defaults
5. Document naming conventions
6. Sample data patterns (sanitized notes — do not commit raw student data)

### Phase 4: Comparative Analysis

For each conceptual field or entity:

| Check | Action |
|-------|--------|
| Present in legacy only? | Mark legacy-only |
| Present in MDB only? | Mark MDB-only |
| Present in both? | Compare name, type, size, meaning |
| Required by stated requirements? | Cross-reference requirements tracker |
| Ambiguous meaning? | Mark REQUIRES HUMAN CONFIRMATION |
| Should not carry forward? | Document rationale |

Populate [mapping-matrix-template.md](./mapping-matrix-template.md).

### Phase 5: Human Review Gate

Present matrix and open questions to human reviewer. Do not proceed to canonical schema design until approved.

## Tools (Analysis Phase)

Appropriate read-only inspection tools may include:

- Legacy repo source review
- MDB inspection via Python (`mdbtools`, `pyodbc`, or similar) — **analysis only**
- Live site observation (no destructive actions)

Do not install application dependencies for the new system during analysis unless needed for inspection scripts (prefer isolated analysis).

## Forbidden During This Phase

- Creating PostgreSQL schema
- Creating migrations
- Inventing canonical fields
- Resolving ambiguous mappings without human input
- Modifying reference MDB
- Committing MDB or exported student data

## Open Investigation Items

| Item | Priority | Owner | Status |
|------|----------|-------|--------|
| Binary photo/signature CSV representation for MDB workflow | High | Analysis phase | RESOLVED (Manual via CardFive) |
| Legacy photo/signature storage format | High | Legacy analysis | RESOLVED (Filesystem) |
| Student ID generation algorithm | High | Legacy analysis | RESOLVED (Manual input) |
| Exact registration field list | High | Legacy + MDB analysis | RESOLVED (Documented in mapping matrix) |
| Address field breakdown (personal vs contact) | High | Legacy + MDB analysis | RESOLVED (Full string mapped to STRT) |
| Duplicate record handling in legacy data | Medium | Legacy data analysis | RESOLVED (Blocks duplicate STUDNO) |
| Academic year / course / section cardinality | Medium | Legacy + MDB analysis | RESOLVED (Documented) |
