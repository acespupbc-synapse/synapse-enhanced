# Project Overview — ACES Synapse Enhanced

## Purpose

ACES Synapse Enhanced is a modernization and redesign of the existing ACES Synapse student registration and administration system. The goal is to preserve useful business behavior and existing data while delivering substantially improved architecture, security, maintainability, UI/UX, deployment reliability, and a clean internal data model.

## Legacy System (Reference Only)

| Item | Location |
|------|----------|
| Legacy repository | https://github.com/JOBIJEEEB/pupbc_synapse |
| Legacy live system | https://aces2026synapse.pythonanywhere.com/ |
| Legacy stack | Python-based web application |

The legacy system is a **reference implementation** for behavior, data, and workflow analysis — **not** the architectural blueprint for the new system.

## Primary Goals (Stated Requirements)

### A. Student Registration

- Student-facing registration panel
- Multi-step registration wizard
- Modern UI/UX
- Live student ID preview
- Student photo capture (device camera) and direct upload
- Photo preview during registration
- Client-side validation (UX) and server-side validation (authoritative)

### B. Administrative Monitoring

- Administrative panel
- View, search, filter, sort registrations
- View and edit individual student records
- Change/upload student picture; upload student signature
- Manage courses, sections, academic years
- Group registrations by academic year
- Open/close student registration
- Soft-delete with recycle bin/trash and restore
- Permanent deletion only through explicitly controlled admin workflows (if eventually required)

### C. Exports (All Mandatory)

- PDF export
- Excel/XLSX export
- CSV export

Exports must follow an explicit export contract — not ad-hoc table dumps.

### D. Future Import

- Import capability is planned but **requirements and input fields are NOT finalized**.
- Final import schema: **TBD** — do not design until requirements are provided.

## Critical Architectural Distinction

Three separate data structures must not be conflated:

1. **Legacy Python application database schema**
2. **Microsoft Access MDB schema**
3. **New application canonical data model**

The new system will have its own normalized canonical model. Legacy and MDB schemas inform migration and export compatibility — they are not the source of truth for application design.

## Data Preservation

Existing ACES Synapse data must remain available in the new system alongside newly registered data. Migration strategy design is **deferred** until legacy schema and data analysis is complete.

## Security Posture

Student information and sensitive files (photos, signatures) require first-class security treatment. See [Security Strategy](../security/security-strategy.md).

## Media Requirements (Verified)

| Asset | Who uploads | Format | Dimensions | Max size |
|-------|-------------|--------|------------|----------|
| Student photo | Student (registration) | JPG | 1500 × 1500 px | 5 MB |
| Student signature | Administrator | JPG | 2000 × 1200 px | REQUIRES VERIFICATION (max size not stated) |

Photos and signatures must be validated server-side and stored securely — not as public URLs by default.

## Address Model (Requirement)

Student personal address and contact person address are **distinct concepts** and must remain separate in UI and data model. Exact field definitions: **TBD** — to be determined during data analysis.

## Current Phase

**Foundation & analysis planning.** No application implementation authorized.

## Next Phase

**Legacy System + MDB Analysis** — structured investigation of legacy repo, live system behavior, legacy DB schema, and MDB reference schema.

## Out of Scope for This Document

- Technology stack selection (TBD)
- Canonical database schema (TBD)
- Import field mapping (TBD)
- MDB binary CSV representation details (investigation item)
