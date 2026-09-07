# Testing Strategy

Testing strategy for ACES Synapse Enhanced. **No tests are implemented in this foundation phase.**

## Evaluation Philosophy

Implementation must be evaluated against:

> "Does this implementation satisfy the approved requirement?"

Not merely:

> "Does the code compile?"

See also: `ai/evaluations/README.md`

## Testing Layers

| Layer | Purpose | Status |
|-------|---------|--------|
| Unit tests | Domain logic, validators, transformers | Planned |
| Integration tests | Service + persistence interactions | Planned |
| Database tests | Constraints, migrations, queries | Planned |
| API / server tests | Endpoints, auth, validation | Planned |
| Component tests | UI components in isolation | Planned (where appropriate) |
| End-to-end (E2E) | Full user workflows in browser | Planned |
| Security tests | Auth bypass, injection, upload abuse | Planned |
| File upload tests | Photo/signature validation | Planned |
| Export tests | CSV/XLSX/PDF contract compliance | Planned |
| Migration tests | Legacy → canonical data integrity | Planned |
| Regression tests | Prevent re-breakage of fixed behavior | Planned |

## High-Priority Test Surfaces

### 1. Student Registration Wizard (E2E)

Critical path:

```
Open registration (precondition)
  → Complete step 1
  → Complete step 2
  → Enter personal address
  → Enter contact person + contact address
  → Capture/upload photo
  → Verify photo preview
  → Review information
  → Submit
  → Verify successful registration
```

Variations to cover:

- Upload vs camera capture (where testable)
- Validation errors per step
- Registration closed — blocked submission
- Invalid photo (wrong size, format, dimensions)

Exact steps: TBD after UX spec finalized.

### 2. Server-Side Validation

Every client-validated field must have server-side test coverage proving rejection of invalid input.

### 3. Authorization

- Student cannot access admin routes
- Unauthenticated admin blocked
- Export endpoints require admin authorization

### 4. Media

| Case | Expected |
|------|----------|
| Valid JPG photo 1500×1500 ≤5MB | Accept |
| Wrong dimensions | Reject |
| Wrong format | Reject |
| Oversized file | Reject |
| Valid signature 2000×1200 | Accept (admin) |
| Student attempting signature upload | Reject |

### 5. Export Compatibility

- CSV columns match MDB contract
- Binary field handling per approved contract
- XLSX structure matches contract
- PDF renders expected content

### 6. Migration

When migration exists:

- Record count parity (where applicable)
- Field transformation correctness
- ID preservation policy (TBD)
- Handling of duplicates and missing values
- Rollback procedure test

## Test Data Strategy

| Concern | Approach | Status |
|---------|----------|--------|
| Synthetic test fixtures | Factory/builder patterns | TBD |
| Legacy sample data | Anonymized subset for migration tests | TBD |
| Media test files | Checked-in sample JPGs at exact dimensions | TBD |
| PII in tests | Never use real student data | VERIFIED policy |

## CI Integration (Future)

- Run unit + integration tests on every PR
- E2E on merge or nightly (TBD based on cost)
- Export contract tests on export module changes
- Security scan for dependencies

Stack-specific CI config: TBD.

## Acceptance Criteria Pattern

Each feature should define:

```markdown
## Acceptance Criteria
- [ ] AC-1: ...
- [ ] AC-2: ...

## Tests
- [ ] Unit: ...
- [ ] Integration: ...
- [ ] E2E: ...
- [ ] Security: ...
```

## AI-Generated Code Testing

AI-generated implementation must include tests for new behavior. The development loop requires test → inspect → fix → retest before acceptance.

## Phase Gate

Test implementation begins with application implementation. Test **plans** and acceptance criteria are defined during specification phases.

## Not In Scope Now

- Choosing test frameworks
- Writing test files
- Setting up CI
- Creating test fixtures
