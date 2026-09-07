# Architecture Principles

Guiding principles for ACES Synapse Enhanced. Technology choices and detailed architecture are **TBD** until requirements and data analysis are sufficiently complete.

## Goals

The future architecture should prioritize:

- **Maintainability** — clear structure, readable code, minimal unnecessary abstraction
- **Security** — first-class concern for student data and media
- **Type safety** — where the chosen stack supports it
- **Separation of concerns** — distinct layers for UI, domain logic, persistence, export, and migration
- **Explicit domain/business logic** — not buried in UI or ORM models alone
- **Database integrity** — constraints, relationships, and validation at the persistence layer
- **Testability** — components testable in isolation
- **Observability** — logging and monitoring appropriate to deployment context
- **Deployment reliability** — reproducible builds and environment configuration
- **Reasonable performance** — appropriate to expected load (REQUIRES VERIFICATION)

## Avoid

- Premature microservices
- Unnecessary infrastructure (Kubernetes, message queues, search engines, etc.)
- Unnecessary cloud complexity
- Unnecessary dependencies
- Tight coupling to legacy database structures
- Tight coupling to MDB export structures
- AI agent frameworks, RAG, or vector databases (not relevant to this system)

## Layered Architecture (Conceptual)

Exact boundaries and technology will be finalized after analysis. Conceptually:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                     │
│  Student registration UI │ Admin panel UI               │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Application / API Layer                                │
│  Authentication │ Authorization │ Validation │ Workflows │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Domain Layer                                           │
│  Registration │ Academic Year │ Courses │ Sections      │
│  Media (photo/signature) │ Soft-delete / restore       │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│  Persistence  │  │  Media Store  │  │  Export Layer │
│  (Canonical   │  │  (Private)    │  │  CSV/XLSX/PDF │
│   DB Model)   │  │               │  │  + MDB map    │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Data Architecture Separation

| Layer | Purpose |
|-------|---------|
| Canonical data model | Internal source of truth for the application |
| Migration mapping | Legacy → canonical transformations |
| Export mapping | Canonical → MDB-compatible / report formats |

Never assume column parity across these layers.

## Media Architecture (Conceptual)

Three concerns must remain distinct:

1. **Application media storage** — secure, private file/blob storage
2. **Database metadata/references** — pointers, hashes, dimensions, upload metadata
3. **MDB binary/export representation** — compatibility format for Access workflow

Do not collapse these into public image URLs.

## Export Architecture

All three export formats (CSV, XLSX, PDF) are mandatory. Exports must be driven by an **explicit export contract** defined after canonical model and MDB analysis — not raw table serialization.

```
Canonical Model → Export Mapping / Transformation → CSV (MDB-compatible)
                                                 → XLSX
                                                 → PDF
```

## Migration Architecture (Future)

Migration is deferred. When designed, it must account for:

- Existing records, relationships, IDs
- Data inconsistencies, duplicates, missing values
- Legacy-only fields and deprecated semantics
- Transformation, validation, failure handling, rollback

## Technology Stack

| Component | Status |
|-----------|--------|
| Frontend framework | TBD |
| Backend / API | TBD |
| Database | TBD (PostgreSQL mentioned in project brief as future direction — REQUIRES HUMAN CONFIRMATION) |
| File storage | TBD |
| Hosting / deployment | TBD |
| Authentication mechanism | TBD |

Stack selection gate: requirements verified + data analysis reviewed + human approval.

## Scalability

Scale appropriately to actual project needs. This is a student registration system for a defined institution — not a hyperscale platform. **Expected load: REQUIRES VERIFICATION.**

## Documentation Method: System Graphs

Important relationships should be documented as explicit graphs where useful. See [System Graphs Method](./system-graphs.md).

Do not finalize entity relationships until data analysis is complete.

## Decision Log

Architectural decisions with rationale will be recorded here as they are approved.

| Date | Decision | Status | Rationale |
|------|----------|--------|-----------|
| — | Technology stack | TBD | Awaiting analysis |
| — | Canonical data model | TBD | Awaiting analysis |
| — | Media storage approach | TBD | Awaiting analysis |
| — | CSV binary field representation | TBD | Investigation item |
