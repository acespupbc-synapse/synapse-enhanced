# AGENTS.md — ACES Synapse Enhanced

Primary instruction document for AI-assisted software engineering on this project.

## What This Project Is

**ACES Synapse Enhanced** is a controlled modernization and redesign of an existing Python-based student registration and administration system (ACES Synapse). It is **not** a simple framework rewrite.

- **Legacy reference:** [pupbc_synapse](https://github.com/JOBIJEEEB/pupbc_synapse)
- **Legacy live system:** https://aces2026synapse.pythonanywhere.com/

The new system must preserve useful business behavior and existing data while substantially improving architecture, security, maintainability, UI/UX, deployment reliability, and the data model.

## What the AI Is Allowed to Do

- Read and update project documentation.
- Analyze legacy code, schemas, and reference artifacts when explicitly in an analysis phase.
- Propose specifications, plans, and architecture **after** sufficient verified context exists.
- Implement features **only when** requirements are verified, documented, and the current phase permits implementation.
- Write tests for implemented behavior.
- Make small, reviewable, focused changes.
- Ask for human clarification when requirements or mappings are ambiguous.
- Update documentation when architecture or contracts change.

## What the AI Must NOT Do

- **Never invent requirements.** If something is not documented or verified, mark it `TBD` or `REQUIRES HUMAN CONFIRMATION`.
- **Never silently resolve ambiguity.** Do not guess field mappings, business rules, or schema relationships.
- **Never use the legacy Python database schema as the canonical model.**
- **Never use the MDB schema as the canonical model.**
- **Never blindly copy** legacy or MDB structures into the new application.
- **Never commit** `reference/mdb/*.mdb`, `reference/mdb/*.accdb`, `.env`, or other local/private artifacts.
- **Never modify** the reference MDB file at `reference/mdb/sample.mdb`.
- **Never weaken security** for convenience.
- **Never expose** student photos, signatures, or other sensitive files as public URLs by default.
- **Never store secrets** in source code.
- **Never implement** application features, database schemas, or migrations during planning/analysis phases unless explicitly authorized.
- **Never over-engineer:** no premature microservices, unnecessary infrastructure, or unjustified dependencies.
- **Never modify unrelated functionality** in a focused task.

## Current Project Phase

**Phase: Foundation & Analysis Planning**

The next authorized work phase is:

1. **Legacy System + MDB Analysis** (read-only investigation)
2. Human review of analysis outputs
3. Then: Data Contract → Canonical Data Model → Architecture → Database Design → UX Design → Implementation

Do not skip phases. Do not implement the application until analysis is reviewed and requirements are verified.

## Architecture Principles

- Maintainability, security, type safety, and clear separation of concerns.
- Explicit domain/business logic; database integrity; testability.
- Observability and deployment reliability appropriate to project scale.
- **Simplest architecture** that satisfies verified requirements.
- Explicit mapping/transformation layers between internal models and export/MDB representations.
- Internal canonical model must **not** be tightly coupled to legacy or MDB structures.

Technology stack: **TBD** — to be selected after requirements and data analysis are sufficiently understood.

## Data Model Rules

Three distinct data structures exist and must be treated separately:

| Structure | Role |
|-----------|------|
| Legacy Python application schema | Reference for migration analysis only |
| Microsoft Access MDB schema | Compatibility/export contract reference |
| New canonical data model | Source of truth for the new application |

Conceptual flow:

```
Legacy System → Legacy analysis / migration mapping → New Canonical Data Model
New Canonical Data Model → Export Mapping / Transformation → MDB-compatible CSV / XLSX / PDF
```

Rules:

- Personal address and contact person address are **separate entities** — do not collapse them.
- Import schema is **TBD** — do not design final import fields until requirements are finalized.
- Photo and signature media have distinct storage, metadata, and MDB binary representation concerns.
- Mark uncertain mappings as `TBD / REQUIRES HUMAN CONFIRMATION`.

## MDB Compatibility Rules

- CSV export must eventually be compatible with the existing MDB workflow (**hard requirement**).
- Do not assume `new DB column = MDB column = CSV column`.
- Use explicit export mapping/transformation layers.
- Binary photo/signature fields display as "Long Binary Data" in Microsoft Access — this behavior must be preserved in MDB-compatible workflows.
- Do not prematurely decide CSV binary representation — document as investigation item.

## Security Principles

Security is first-class. Future implementation must:

- Treat server-side validation as authoritative; never trust client-only validation.
- Enforce authorization server-side; separate authentication from authorization.
- Prevent students from accessing administrative functions.
- Treat photos and signatures as private application data.
- Validate uploads by content/type/size/dimensions — not file extension alone.
- Use environment variables or secure secret management for secrets.
- Use parameterized/ORM-safe database queries.
- Consider CSRF, rate limiting, auditability, and safe error messages.
- Document security decisions.

Do not implement security mechanisms during planning phases — document requirements and analysis plans.

## Media Requirements (Verified)

| Asset | Format | Dimensions | Max Size | Notes |
|-------|--------|------------|----------|-------|
| Student photo | JPG | 1500 × 1500 px | 5 MB | Camera capture + upload; preview before submit |
| Student signature | JPG | 2000 × 1200 px | TBD | White background; admin upload only |

Server-side validation and secure storage are required in implementation — not yet built.

## Testing Expectations

Future implementation must be evaluated against approved requirements, not merely "does it compile."

Testing layers (to be implemented later):

- Unit, integration, database, API, component, E2E, security, file upload, export, migration, and regression tests.
- Student registration wizard is a high-priority E2E surface.

Do not implement tests during foundation/analysis phases unless explicitly requested.

## Documentation Expectations

- Keep docs under `docs/` organized by domain.
- Distinguish **verified facts** from **assumptions** and **TBD** items.
- Update docs when architecture, contracts, or requirements change.
- Use `docs/requirements/requirements-status.md` as the living requirements tracker.

## Requirement Verification

Before implementing any feature:

1. Confirm the requirement is documented and verified (not TBD).
2. Read relevant docs: requirements, architecture, security, data contracts, UX specs.
3. Identify acceptance criteria.
4. Produce an implementation plan if the change is non-trivial.
5. Implement in small, reviewable steps.
6. Add tests.
7. Conduct security review for sensitive surfaces.
8. Update documentation.

If a mapping, business rule, or field definition is ambiguous → **stop and ask**.

## Human Approval Boundaries

Require explicit human confirmation before:

- Finalizing the canonical data model or database schema.
- Resolving any item marked `REQUIRES HUMAN CONFIRMATION`.
- Changing export/MDB compatibility contracts.
- Permanent deletion workflows or irreversible data operations.
- Technology stack selection.
- Import field mapping (requirements not yet finalized).
- Any architectural decision depending on unverified information.

## AI Workflow

Follow this loop for significant work:

```
REQUIREMENT → SPECIFICATION → CONTEXT COLLECTION → ARCHITECTURE
  → IMPLEMENTATION PLAN → IMPLEMENTATION → AUTOMATED TESTS
  → SECURITY REVIEW → CODE REVIEW → ACCEPTANCE → DOCUMENTATION UPDATE
```

Controlled development loop:

```
PLAN → IMPLEMENT → TEST → INSPECT → FIX → RETEST → REVIEW → ACCEPT
```

Do not repeatedly modify code without verification.

## Context Hierarchy

Load the **minimum relevant context** for each task. See `ai/context/README.md`.

Priority order:

1. `AGENTS.md` (this file)
2. Project requirements (`docs/requirements/`)
3. Architecture documents (`docs/architecture/`)
4. Database/data-contract documents (`docs/database/`)
5. Security documents (`docs/security/`)
6. UX specifications (`docs/ux/`)
7. Legacy analysis (`docs/legacy/`)
8. MDB analysis (`docs/mdb/`)
9. Feature specifications
10. Tests

## Prompts and Evaluations

- Reusable prompts: `ai/prompts/` — see `ai/prompts/README.md`
- Evaluation strategy: `ai/evaluations/README.md`
- Development workflow: `docs/ai-development-workflow.md`

## Repository Structure

```
AGENTS.md
docs/
  requirements/
  architecture/
  database/
  ux/
  security/
  exports/
  mdb/
  legacy/
ai/
  prompts/
  context/
  evaluations/
reference/
  mdb/          # Local reference only — never commit *.mdb / *.accdb
```

Do not create application directories (e.g., Next.js app, migrations) until authorized by phase.

## Reference Artifacts

- `reference/mdb/sample.mdb` — **reference only**; do not modify, commit, or use as application database.
- Legacy repo and live site — behavioral and schema reference for analysis.

## Quick Reference: Forbidden During Analysis Phase

- Creating Next.js application
- Creating PostgreSQL schema or migrations
- Inventing database fields
- Designing final import schema
- Guessing ambiguous mappings
- Installing application dependencies
