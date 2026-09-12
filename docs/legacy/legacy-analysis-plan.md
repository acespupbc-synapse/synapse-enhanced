# Legacy Analysis Plan

Structured plan for analyzing the existing ACES Synapse Python system. The legacy system is a **behavioral and data reference** — not the architectural blueprint for the new system.

## References

| Resource | URL / Location |
|----------|----------------|
| Legacy repository | https://github.com/JOBIJEEEB/pupbc_synapse |
| Legacy live system | https://aces2026synapse.pythonanywhere.com/ |

## Objectives

Document verified facts about the legacy system to inform migration mapping, export compatibility, UX improvement, and canonical model design — without reproducing legacy architecture.

## Analysis Areas

### 1. Database Schema

- [x] Tables and relationships
- [x] Column names, types, sizes, nullability
- [x] Primary and foreign keys
- [x] Indexes and constraints
- [x] Photo and signature storage mechanism
- [x] Personal address vs contact person address fields
- [x] Academic year, course, section structures
- [x] Soft-delete / trash implementation
- [x] Registration status fields

**Output:** `docs/legacy/legacy-schema.md`

### 2. Registration Workflow

- [x] Multi-step flow (if present)
- [x] Field list per step
- [x] Client and server validation rules
- [x] Photo capture/upload behavior
- [x] Student ID preview logic
- [x] Submission and confirmation behavior
- [x] Behavior when registration is closed

**Output:** `docs/legacy/legacy-workflows.md` (registration section)

### 3. Administrative Workflow

- [x] Authentication mechanism
- [x] Authorization model
- [x] CRUD operations on registrations
- [x] Search, filter, sort capabilities
- [x] Photo and signature management
- [x] Course, section, academic year management
- [x] Open/close registration control
- [x] Soft-delete, restore, permanent delete (if any)
- [x] Grouping by academic year

**Output:** `docs/legacy/legacy-workflows.md` (admin section)

### 4. Export Behavior

- [x] CSV export format and columns
- [x] XLSX export (if present)
- [x] PDF export (if present)
- [x] How photos/signatures appear in exports
- [x] MDB workflow integration points (if documented in legacy)

**Output:** `docs/legacy/legacy-exports.md`

### 5. Business Rules and Edge Cases

- [x] Student ID generation
- [x] Duplicate handling
- [x] Required vs optional fields
- [x] Data inconsistencies in production data (patterns, not PII)
- [x] Legacy-only fields with unclear purpose
- [x] Derived/computed fields

**Output:** `docs/legacy/legacy-business-rules.md`

### 6. UI/UX Reference (Behavioral, Not Binding)

- [x] Registration panel layout and flow
- [x] Admin panel information density
- [x] Footer content and credentials
- [x] Student ID layout
- [x] Mobile behavior (if observable)
- [x] Error message patterns

**Output:** `docs/legacy/legacy-ui-reference.md`

Note: New UI should **improve** on legacy — document behavior and content, not pixel-perfect reproduction.

## Methodology

1. **Source-first:** Prefer code and schema definitions over assumptions from UI alone.
2. **Live site observation:** Read-only exploration; no data modification.
3. **Fact vs inference:** Label inferences as `INFERRED — REQUIRES VERIFICATION`.
4. **No guessing:** Unknown items remain TBD.
5. **No legacy code copy:** Extract semantics, not implementation.

## Repository Analysis Checklist

When examining `pupbc_synapse`:

- [x] Project structure and entry points
- [x] Database models / migrations
- [x] Forms and validation
- [x] Views / routes / API endpoints
- [x] Templates and static assets
- [x] Export modules
- [x] Configuration and environment variables
- [x] Dependencies (`requirements.txt`, etc.)
- [x] Tests (if any) for behavioral hints
- [x] README and inline documentation

## Deliverables

| File | Description | Status |
|------|-------------|--------|
| `legacy-schema.md` | Database schema documentation | DONE |
| `legacy-workflows.md` | Registration and admin workflows | DONE |
| `legacy-exports.md` | Export behavior | DONE |
| `legacy-business-rules.md` | Rules and edge cases | DONE |
| `legacy-ui-reference.md` | UI/UX behavioral reference | DONE |

## Constraints

- Do not modify the legacy repository
- Do not commit legacy database dumps or student PII
- Do not treat legacy schema as canonical
- Do not implement new system features during analysis

## Success Criteria

Analysis is complete when:

1. All checklist areas have documented findings or explicit TBD items
2. Legacy schema is fully inventoried
3. Open questions are listed for human review
4. Findings are ready to feed the mapping/discrepancy matrix

## Next Step After Legacy Analysis

Combine with MDB analysis → populate mapping matrix → human review → data contract phase.
