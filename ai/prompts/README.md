# AI Prompts

Version-controlled, reusable prompts for AI-assisted engineering on ACES Synapse Enhanced.

## Strategy

Prompts are engineering artifacts — not ad-hoc chat messages. They provide consistent, repeatable review and analysis behavior across Cursor Agent sessions.

### Principles

- One prompt per distinct review or analysis type
- Clear role, context, constraints, inputs, outputs
- Explicit forbidden behavior (e.g., "do not invent requirements")
- Verification requirements in expected output
- Start with a small essential set; add prompts when repeated need emerges

### Do Not

- Create dozens of prompts prematurely
- Duplicate `AGENTS.md` content — prompts reference it
- Use prompts to bypass human approval gates

## Planned Prompts

Create these when the corresponding phase begins. Status: **planned, not yet authored.**

| Prompt File | Purpose | Phase |
|-------------|---------|-------|
| `architecture-review.md` | Review structural changes against principles | Implementation |
| `security-review.md` | Defect-first security review of changes | Implementation |
| `database-review.md` | Review schema/migration proposals | Data contract |
| `ux-review.md` | Review UI against UX strategy and a11y | UX design |
| `legacy-analysis.md` | Guide systematic legacy repo investigation | Analysis |
| `mdb-analysis.md` | Guide MDB schema inspection | Analysis |
| `migration-review.md` | Review migration scripts and mappings | Migration |
| `export-compatibility-review.md` | Review CSV/export against MDB contract | Export |
| `test-generation.md` | Generate tests from acceptance criteria | Implementation |
| `code-review.md` | General defect-first code review | Implementation |
| `refactoring-review.md` | Assess refactor scope and risk | Maintenance |

## Prompt Template

When authoring a new prompt, use this structure:

```markdown
# [Prompt Name]

## Role
You are a [specific role] reviewing [subject] for ACES Synapse Enhanced.

## Context
- Read AGENTS.md first
- [Additional docs to load]

## Objective
[What this prompt produces]

## Constraints
- Do not invent requirements
- Mark unverified items as TBD
- [Task-specific constraints]

## Inputs
- [Files, diffs, specs the user will provide]

## Expected Outputs
1. [Structured output sections]

## Forbidden Behavior
- [Explicit prohibitions]

## Verification Requirements
- [How to validate the output is complete]
```

## Usage

1. User invokes prompt from `ai/prompts/` in Cursor Agent
2. User attaches task-specific inputs (files, diffs, specs)
3. Agent follows prompt structure
4. Output is reviewed by human before action

## Maintenance

- Update prompts when `AGENTS.md` or phase gates change
- Version significant prompt changes via commit messages
- Retire prompts that are unused or superseded

## Related

- [AI Development Workflow](../docs/ai-development-workflow.md)
- [Context Hierarchy](../ai/context/README.md)
- [Evaluation Strategy](../ai/evaluations/README.md)
