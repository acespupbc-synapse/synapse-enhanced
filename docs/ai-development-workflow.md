# AI Development Workflow

Controlled AI-assisted development workflow for ACES Synapse Enhanced.

## Engineering Pipeline

```
REQUIREMENT
    ↓
SPECIFICATION
    ↓
CONTEXT COLLECTION
    ↓
ARCHITECTURE
    ↓
IMPLEMENTATION PLAN
    ↓
IMPLEMENTATION
    ↓
AUTOMATED TESTS
    ↓
SECURITY REVIEW
    ↓
CODE REVIEW
    ↓
ACCEPTANCE
    ↓
DOCUMENTATION UPDATE
```

## Development Loop

For each significant feature or change:

```
PLAN → IMPLEMENT → TEST → INSPECT → FIX → RETEST → REVIEW → ACCEPT
```

The AI must **not** repeatedly modify code without verification between iterations.

## Phase-Aware Behavior

| Phase | AI May | AI Must Not |
|-------|--------|-------------|
| Foundation (current) | Create docs, plans, analysis artifacts | Implement app, schema, migrations |
| Legacy + MDB analysis | Read-only investigation, document findings | Guess mappings, modify reference MDB |
| Data contract | Propose canonical model for review | Implement without human approval |
| Implementation | Build features per verified specs | Invent requirements, skip tests |

Always check `AGENTS.md` and `docs/requirements/requirements-status.md` for current phase.

## Task Startup Checklist

Before any non-trivial task:

1. Read `AGENTS.md`
2. Identify current project phase
3. Load minimum relevant context (see `ai/context/README.md`)
4. Confirm requirements are VERIFIED (not TBD) for implementation tasks
5. List acceptance criteria
6. Produce implementation plan if change spans multiple files or layers

## Context Collection

Gather only what the task needs:

| Task Type | Typical Context |
|-----------|-----------------|
| Legacy analysis | `docs/legacy/`, legacy repo, `AGENTS.md` |
| MDB analysis | `docs/mdb/`, reference MDB, `AGENTS.md` |
| Schema design | Analysis outputs, mapping matrix, requirements |
| Feature implementation | Feature spec, architecture, security, UX |
| Export work | Export strategy, MDB compatibility, canonical model |
| Security review | Security strategy, feature spec, changed files |

Do not load the entire repository indiscriminately.

## Specification Standards

Specifications should include:

- Requirement IDs (from requirements tracker)
- Scope and non-goals
- Acceptance criteria
- Security considerations
- Test plan outline
- Open questions (TBD items)

## Implementation Standards

- Small, reviewable changes
- Match existing conventions once code exists
- No unnecessary dependencies or abstractions
- No unrelated modifications
- Server-side validation for all authoritative rules
- Tests for new behavior

## Review Gates

| Review | When | Method |
|--------|------|--------|
| Security review | Sensitive features (auth, uploads, exports, admin) | Checklist + optional AI prompt |
| Code review | All significant changes | Human and/or AI prompt |
| Architecture review | Structural changes | Human approval required |
| Export compatibility | Export contract changes | Contract tests + human approval |

Reusable review prompts: `ai/prompts/` (see README).

## Ambiguity Handling

When encountering ambiguity:

1. Stop implementation
2. Document the question
3. Mark affected items `REQUIRES HUMAN CONFIRMATION`
4. Ask the human reviewer
5. Update requirements tracker and docs with decision

Never silently guess.

## Documentation Updates

Update documentation when:

- Architecture decisions are made
- Requirements change status (TBD → VERIFIED)
- Export or migration contracts are defined
- Analysis produces new findings
- Security decisions are finalized

## Prompt Engineering

Prompts are version-controlled engineering artifacts in `ai/prompts/`.

See `ai/prompts/README.md` for structure and planned prompt types.

## Evaluation

AI output is evaluated against objective criteria — see `ai/evaluations/README.md`.

## Graph Documentation

Document important relationships as graphs when useful — see `docs/architecture/system-graphs.md`.

## Current Status

**Phase: Foundation complete → Next: Legacy System + MDB Analysis**

Implementation is not authorized until analysis is reviewed and data contract approved.
