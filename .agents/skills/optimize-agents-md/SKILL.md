---
name: optimize-agents-md
description: Review and improve AGENTS.md or scoped agent instructions in this repo. Use when asked to compress, clarify, reorganize, or harden agent workflow rules.
license: ISC
---

# Optimize AGENTS.md

## Purpose

Improve `AGENTS.md` and scoped agent instruction files without weakening the
repo's operational contract.

Use this skill when the user asks to:

- reduce instruction bloat
- clarify confusing workflow rules
- add a lesson learned from a recent mistake
- remove stale or duplicate guidance
- reorganize agent instructions for better retrieval
- update commit, PR, validation, skill, or evidence-collection rules

Do not optimize by chasing a fixed token target. Preserve rules that encode
repo-specific safety, validation, or workflow constraints even when they are
verbose.

## Authority

Before editing instructions, collect current evidence:

```bash
git log --oneline -20
git diff main...HEAD --stat
git log --oneline -- AGENTS.md
find .agents/skills -name 'SKILL.md' | sort
```

When sources conflict, use the repo hierarchy:

1. `src/` code and executable behavior
2. git history
3. `AGENTS.md` by scope
4. docs and skills

Update stale prose rather than making code conform to stale docs.

## Editing Rules

- Keep concrete rules that prevent real failures, even if they cost tokens.
- Prefer one precise rule over several overlapping reminders.
- Preserve current repo conventions: Bun-first workflow, `gh` for GitHub,
  conventional commits, scoped validation, directory boundaries, module naming,
  and skill-trigger guidance.
- Remove references to retired surfaces only after verifying with `rg`.
- Do not introduce a public validation CLI unless it exists in the repo.
- Do not replace operational rules with generic advice agents already know.
- Do not add broad "always run everything" gates when AGENTS.md already requires
  area-aware validation.

## Workflow

1. Identify the target scope:
   - root `AGENTS.md`
   - nested `AGENTS.md`
   - skill-local instructions
   - all of the above

2. Search before changing:

```bash
rg -n "stale-term|removed-command|old-path" AGENTS.md docs skills src package.json
git log --oneline -- AGENTS.md
```

3. Classify each candidate edit:
   - `remove`: stale, duplicated, or generic instruction
   - `merge`: repeated project-specific rule
   - `clarify`: correct rule that caused confusion
   - `add`: recent failure mode or missing project constraint

4. Edit narrowly. Keep related docs in sync when instruction changes affect
   docs, skills, PR workflow, commit workflow, or validation policy.

5. Verify:

```bash
git diff --check -- AGENTS.md
rg -n "removed-command|old-path" AGENTS.md docs skills src package.json
```

For docs-only instruction edits, executable validation is usually unnecessary.
State that explicitly in the final response. If the edit changes scripts, skill
contracts, schemas, or runtime guidance with executable effects, run the
affected targeted tests.

## Compression Patterns

Prefer compact, testable instructions:

```markdown
**Commit messages** - Use conventional commits. For multi-line bodies, prefer
`git commit -F /tmp/message.txt`; keep body lines <=100 chars.
```

Avoid vague compression:

```markdown
Be concise and commit correctly.
```

Use tables only when they make scanning easier. Long tables with dense prose are
not an improvement.

## Learning Updates

Add or refine rules when a concrete failure occurs, such as:

- a commitlint rejection
- a stale command path surviving cleanup
- a validation gap found during review
- a tool behavior misunderstanding
- a repo boundary violation

Write the rule as an actionable constraint, not a diary entry. Include the
verification command when one exists.

## Final Response

Report:

- files changed
- rules clarified or removed
- stale-reference checks run
- validation run or why executable validation was skipped
