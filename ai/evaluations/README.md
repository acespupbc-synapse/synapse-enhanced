# Evaluation Engineering

Strategy for evaluating AI-generated and human-written implementation against objective criteria.

## Purpose

Make it possible to answer:

> **"Does this implementation satisfy the approved requirement?"**

Rather than merely:

> "Does the code compile?"

## Evaluation Dimensions

| Dimension | Methods | When |
|-----------|---------|------|
| Functional correctness | Unit, integration, E2E tests | Implementation |
| Requirement traceability | Acceptance criteria checklist | Acceptance |
| Security | Security tests, review checklist | Pre-merge |
| Data integrity | DB tests, migration validation | Schema/migration |
| Export compatibility | Contract tests, MDB round-trip | Export features |
| UX quality | E2E wizard tests, manual review | UI features |
| Regression | Regression test suite | Ongoing |

## Requirement → Test Traceability

Each verified requirement in `docs/requirements/requirements-status.md` should eventually link to:

- Acceptance criteria (feature spec)
- Test cases (automated where possible)
- Manual verification steps (where automation is impractical)

Example (future):

```
R-REG-05 (Photo capture)
  → AC: Student can capture photo via camera on mobile
  → E2E: registration-wizard-photo-camera.spec.ts
  → Manual: iOS Safari smoke test (TBD)
```

## AI Output Evaluation Checklist

Before accepting AI-generated code:

- [ ] Matches verified requirements only — no invented features
- [ ] Server-side validation present for authoritative rules
- [ ] Authorization checks on protected operations
- [ ] Tests included for new behavior
- [ ] No secrets or PII committed
- [ ] Documentation updated if architecture changed
- [ ] No unrelated file modifications
- [ ] Ambiguous areas marked TBD, not guessed

## Review Prompts as Evaluation Tools

Structured review prompts in `ai/prompts/` provide repeatable evaluation:

- Security review → vulnerability-focused
- Code review → defect-focused
- Export compatibility review → contract-focused

Prompts supplement — do not replace — automated tests.

## Export Evaluation

Export implementations must pass:

1. **Contract tests** — column headers, types, formatting
2. **Snapshot tests** — stable output for fixture data (TBD)
3. **MDB compatibility verification** — procedure TBD after investigation

## Migration Evaluation

When migration exists:

- Pre/post record counts and spot checks
- Transformation correctness on known fixtures
- Failure and rollback drills
- No silent data loss

## Continuous Improvement

After each phase:

- Record evaluation gaps (tests that should exist but don't)
- Update testing strategy
- Add prompts for repeated review patterns

## Not In Scope Now

- Implementing test runners or CI
- Creating evaluation scripts
- Defining coverage thresholds (TBD with stack selection)

## Related

- [Testing Strategy](../../docs/testing/testing-strategy.md)
- [AI Development Workflow](../../docs/ai-development-workflow.md)
