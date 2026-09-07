# Requirements Status

Living tracker for ACES Synapse Enhanced requirements. Update this document as items are verified, clarified, or implemented.

**Legend:**

| Status | Meaning |
|--------|---------|
| VERIFIED | Explicitly stated and accepted for planning |
| PARTIAL | Stated but details incomplete |
| TBD | Not yet defined |
| REQUIRES VERIFICATION | Needs confirmation from legacy analysis or human review |
| REQUIRES HUMAN CONFIRMATION | Ambiguous; must not be guessed |
| DEFERRED | Intentionally postponed to a later phase |
| IMPLEMENTED | Built and accepted (none yet) |

---

## Core System

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-CORE-01 | Modernize student registration system | VERIFIED | Project charter |
| R-CORE-02 | Preserve existing data | VERIFIED | Migration deferred |
| R-CORE-03 | Preserve useful business behavior | VERIFIED | Legacy is reference, not blueprint |
| R-CORE-04 | Substantially improved architecture | VERIFIED | Not a simple rewrite |
| R-CORE-05 | Technology stack | TBD | Select after data analysis |

---

## Student Registration

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-REG-01 | Student-facing registration panel | VERIFIED | |
| R-REG-02 | Multi-step registration wizard | VERIFIED | |
| R-REG-03 | Modern UI/UX | VERIFIED | |
| R-REG-04 | Live student ID preview | VERIFIED | Layout details: REQUIRES VERIFICATION from legacy |
| R-REG-05 | Photo capture via device camera | VERIFIED | |
| R-REG-06 | Direct photo upload | VERIFIED | |
| R-REG-07 | Photo preview before submission | VERIFIED | |
| R-REG-08 | Client-side validation (UX) | VERIFIED | |
| R-REG-09 | Server-side validation (authoritative) | VERIFIED | |
| R-REG-10 | Registration field set | REQUIRES VERIFICATION | Derive from legacy + MDB analysis |
| R-REG-11 | Registration workflow steps | REQUIRES VERIFICATION | Derive from legacy analysis |
| R-REG-12 | Student ID generation rules | REQUIRES VERIFICATION | Derive from legacy analysis |
| R-REG-13 | Open/close registration (student-facing gate) | VERIFIED | Admin-controlled |

---

## Administrative Panel

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-ADM-01 | Administrative panel | VERIFIED | |
| R-ADM-02 | View all registrations | VERIFIED | |
| R-ADM-03 | Search / filter / sort | VERIFIED | |
| R-ADM-04 | View individual student records | VERIFIED | |
| R-ADM-05 | Edit student inputs | VERIFIED | |
| R-ADM-06 | Change/upload student picture | VERIFIED | |
| R-ADM-07 | Upload student signature | VERIFIED | Admin only |
| R-ADM-08 | Add courses | VERIFIED | |
| R-ADM-09 | Add sections | VERIFIED | |
| R-ADM-10 | Manage academic years | VERIFIED | |
| R-ADM-11 | Group by academic year | VERIFIED | |
| R-ADM-12 | Soft-delete registrations | VERIFIED | |
| R-ADM-13 | Recycle bin / restore | VERIFIED | |
| R-ADM-14 | Permanent deletion | PARTIAL | Only via explicit controlled workflow if required |
| R-ADM-15 | Admin authentication | VERIFIED | Mechanism TBD |
| R-ADM-16 | Admin authorization model | TBD | Roles/permissions REQUIRES HUMAN CONFIRMATION |
| R-ADM-17 | Audit log for admin actions | PARTIAL | "Should be considered" — scope TBD |

---

## Exports

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-EXP-01 | PDF export | VERIFIED | Mandatory |
| R-EXP-02 | XLSX export | VERIFIED | Mandatory |
| R-EXP-03 | CSV export | VERIFIED | Mandatory |
| R-EXP-04 | Explicit export contract | VERIFIED | Not ad-hoc table dumps |
| R-EXP-05 | CSV MDB workflow compatibility | VERIFIED | Hard requirement |
| R-EXP-06 | Export column mapping | TBD | After MDB + canonical model analysis |
| R-EXP-07 | Binary photo/signature in exports | REQUIRES HUMAN CONFIRMATION | CSV representation under investigation |

---

## Import

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-IMP-01 | Future import capability | VERIFIED | Planned |
| R-IMP-02 | Import input fields | TBD | Not finalized |
| R-IMP-03 | Import schema / mapping | DEFERRED | Do not design until requirements provided |

---

## Media

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-MED-01 | Student photo: JPG, 1500×1500, max 5 MB | VERIFIED | |
| R-MED-02 | Student signature: JPG, 2000×1200, white background | VERIFIED | Max size not stated |
| R-MED-03 | Signature uploaded by admin only | VERIFIED | |
| R-MED-04 | Server-side media validation | VERIFIED | Not yet implemented |
| R-MED-05 | Secure private storage | VERIFIED | Not public URLs by default |
| R-MED-06 | MDB "Long Binary Data" behavior | VERIFIED | Must preserve in MDB workflow |

---

## Data Model

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-DATA-01 | Separate canonical model from legacy schema | VERIFIED | |
| R-DATA-02 | Separate canonical model from MDB schema | VERIFIED | |
| R-DATA-03 | Personal address ≠ contact person address | VERIFIED | Field details TBD |
| R-DATA-04 | Canonical schema design | DEFERRED | After analysis review |
| R-DATA-05 | Migration implementation | DEFERRED | After analysis review |
| R-DATA-06 | Mapping / discrepancy matrix | TBD | Output of analysis phase |

---

## Security

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-SEC-01 | Server-side validation authoritative | VERIFIED | |
| R-SEC-02 | Server-side authorization | VERIFIED | |
| R-SEC-03 | Students cannot access admin functions | VERIFIED | |
| R-SEC-04 | Private file storage for photos/signatures | VERIFIED | |
| R-SEC-05 | Upload validation (content/type/size/dimensions) | VERIFIED | |
| R-SEC-06 | No secrets in source code | VERIFIED | |
| R-SEC-07 | Parameterized / ORM-safe queries | VERIFIED | |
| R-SEC-08 | CSRF / session protections | PARTIAL | Consider where applicable |
| R-SEC-09 | Rate limiting on public registration | PARTIAL | Consider for abuse prevention |
| R-SEC-10 | Safe error messages | VERIFIED | |
| R-SEC-11 | Security decisions documented | VERIFIED | |

---

## UX

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-UX-01 | Clean, modern, accessible, responsive UI | VERIFIED | |
| R-UX-02 | Mobile camera/photo experience | VERIFIED | |
| R-UX-03 | Registration wizard high priority | VERIFIED | |
| R-UX-04 | Footer content / credentials | REQUIRES VERIFICATION | From legacy analysis |
| R-UX-05 | Exact wizard steps and copy | TBD | After UX + legacy analysis |

---

## Testing

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| R-TEST-01 | Multi-layer test strategy | VERIFIED | Documented; not implemented |
| R-TEST-02 | E2E registration wizard tests | VERIFIED | High priority when implemented |
| R-TEST-03 | Export compatibility tests | VERIFIED | When export layer exists |
| R-TEST-04 | Migration validation tests | VERIFIED | When migration exists |

---

## Analysis Deliverables (Next Phase)

| ID | Deliverable | Status |
|----|-------------|--------|
| A-01 | Legacy database schema documentation | TBD |
| A-02 | Legacy workflow documentation | TBD |
| A-03 | MDB schema documentation | TBD |
| A-04 | MDB data pattern analysis | TBD |
| A-05 | Mapping / discrepancy matrix | TBD |
| A-06 | Export compatibility investigation (binary fields) | TBD |
