# Context Engineering

Strategy for deliberate context hierarchy in AI-assisted development.

## Goal

Provide the AI the **minimum relevant context** necessary for a task — not the entire project indiscriminately.

## Context Hierarchy

Load in this priority order (stop when sufficient):

| Priority | Source | Path |
|----------|--------|------|
| 1 | AI agent instructions | `AGENTS.md` |
| 2 | Project requirements | `docs/requirements/` |
| 3 | Architecture | `docs/architecture/` |
| 4 | Database / data contracts | `docs/database/` |
| 5 | Security | `docs/security/` |
| 6 | UX | `docs/ux/` |
| 7 | Legacy analysis | `docs/legacy/` |
| 8 | MDB analysis | `docs/mdb/` |
| 9 | Exports | `docs/exports/` |
| 10 | Feature specifications | TBD — per feature |
| 11 | Tests | TBD — when implemented |

## Task-Specific Context Maps

### Foundation / Documentation Tasks

```
AGENTS.md
docs/requirements/project-overview.md
(relevant strategy doc for the task)
```

### Legacy Analysis

```
AGENTS.md
docs/legacy/legacy-analysis-plan.md
docs/database/data-architecture.md
docs/requirements/requirements-status.md
+ legacy repository (external)
```

### MDB Analysis

```
AGENTS.md
docs/mdb/mdb-compatibility-strategy.md
docs/database/data-architecture.md
reference/mdb/sample.mdb (local, read-only)
```

### Canonical Schema Design (Future)

```
AGENTS.md
docs/database/analysis-summary.md
docs/database/mapping-matrix.md
docs/requirements/requirements-status.md
docs/security/security-strategy.md
+ human decisions from confirmation log
```

### Feature Implementation (Future)

```
AGENTS.md
Feature spec (TBD location)
docs/requirements/requirements-status.md
Relevant architecture + security + UX docs
Affected source files
Related tests
```

### Export Implementation (Future)

```
AGENTS.md
docs/exports/export-strategy.md
docs/mdb/mdb-compatibility-strategy.md
Export contract (TBD)
Canonical model docs (TBD)
```

## Context Files in This Directory

Use `ai/context/` for curated context bundles when a task repeatedly needs the same doc set:

| File | Purpose | Status |
|------|---------|--------|
| `analysis-phase.md` | Bundle for legacy + MDB analysis | TBD |
| `implementation-phase.md` | Bundle for feature work | TBD |

Create bundles only when repetition justifies them.

## Facts vs Assumptions

When loading context, distinguish:

| Label | Meaning |
|-------|---------|
| VERIFIED | Documented and accepted |
| TBD | Not yet determined |
| REQUIRES VERIFICATION | Needs analysis or confirmation |
| INFERRED | Derived from indirect evidence — treat cautiously |

## Anti-Patterns

- Loading legacy schema docs during pure UX copy tasks
- Loading full MDB analysis during unrelated bug fixes
- Treating placeholder graphs as verified schema
- Using reference MDB as runtime context for implementation

## Related

- [AGENTS.md](../../AGENTS.md)
- [AI Development Workflow](../../docs/ai-development-workflow.md)
