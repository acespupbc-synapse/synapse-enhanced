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

- [ ] Tables and relationships
- [ ] Column names, types, sizes, nullability
- [ ] Primary and foreign keys
- [ ] Indexes and constraints
- [ ] Photo and signature storage mechanism
- [ ] Personal address vs contact person address fields
- [ ] Academic year, course, section structures
- [ ] Soft-delete / trash implementation
- [ ] Registration status fields

**Output:** `docs/legacy/legacy-schema.md`

### 2. Registration Workflow

- [ ] Multi-step flow (if present)
- [ ] Field list per step
- [ ] Client and server validation rules
- [ ] Photo capture/upload behavior
- [ ] Student ID preview logic
- [ ] Submission and confirmation behavior
- [ ] Behavior when registration is closed

**Output:** `docs/legacy/legacy-workflows.md` (registration section)

### 3. Administrative Workflow

- [ ] Authentication mechanism
- [ ] Authorization model
- [ ] CRUD operations on registrations
- [ ] Search, filter, sort capabilities
- [ ] Photo and signature management
- [ ] Course, section, academic year management
- [ ] Open/close registration control
- [ ] Soft-delete, restore, permanent delete (if any)
- [ ] Grouping by academic year

**Output:** `docs/legacy/legacy-workflows.md` (admin section)

### 4. Export Behavior

- [ ] CSV export format and columns
- [ ] XLSX export (if present)
- [ ] PDF export (if present)
- [ ] How photos/signatures appear in exports
- [ ] MDB workflow integration points (if documented in legacy)

**Output:** `docs/legacy/legacy-exports.md`

### 5. Business Rules and Edge Cases

- [ ] Student ID generation
- [ ] Duplicate handling
- [ ] Required vs optional fields
- [ ] Data inconsistencies in production data (patterns, not PII)
- [ ] Legacy-only fields with unclear purpose
- [ ] Derived/computed fields

**Output:** `docs/legacy/legacy-business-rules.md`

### 6. UI/UX Reference (Behavioral, Not Binding)

- [ ] Registration panel layout and flow
- [ ] Admin panel information density
- [ ] Footer content and credentials
- [ ] Student ID layout
- [ ] Mobile behavior (if observable)
- [ ] Error message patterns

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

- [ ] Project structure and entry points
- [ ] Database models / migrations
- [ ] Forms and validation
- [ ] Views / routes / API endpoints
- [ ] Templates and static assets
- [ ] Export modules
- [ ] Configuration and environment variables
- [ ] Dependencies (`requirements.txt`, etc.)
- [ ] Tests (if any) for behavioral hints
- [ ] README and inline documentation

## Deliverables

| File | Description | Status |
|------|-------------|--------|
| `legacy-schema.md` | Database schema documentation | TBD |
| `legacy-workflows.md` | Registration and admin workflows | TBD |
| `legacy-exports.md` | Export behavior | TBD |
| `legacy-business-rules.md` | Rules and edge cases | TBD |
| `legacy-ui-reference.md` | UI/UX behavioral reference | TBD |

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
