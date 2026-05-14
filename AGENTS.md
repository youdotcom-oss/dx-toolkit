---
description: Lean maintainer guide for the You.com DX Toolkit monorepo.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json, AGENTS.md"
alwaysApply: false
---

# You.com DX Toolkit

Bun workspace for You.com developer packages and integrations.

Prefer the root [README.md](./README.md) for user-facing setup. This file is
for maintainers and coding agents working inside the repo.

---

## Behavioral Guidelines

### Think Before Coding

State assumptions. Surface tradeoffs. If multiple interpretations exist,
present them instead of picking silently. If the repo already answers the
question, use the codebase as the source of truth.

### Simplicity First

Make the smallest change that solves the request. Do not add abstractions,
fallbacks, or cleanup outside the task unless the change requires them.

### Surgical Changes

Touch only the files the task needs. Match existing style. Remove imports or
variables you orphan, but leave unrelated code alone.

### Goal-Driven Execution

Turn work into verifiable outcomes. For behavior-changing feature or fix work,
use the `tdd` skill and work in red-green-refactor slices. For docs-only or
instruction-only edits, targeted doc validation is enough.

### Validate Before Handoff

Run the narrowest checks that prove the change. If you skip executable tests,
say why. Before trusting repo docs, verify the current state with `rg`, `find`,
`git log`, or the relevant workflow/package files.

---

## Repo Shape

### Core Paths

| Path | Purpose |
|------|---------|
| `.agents/skills/` | Canonical skill directory for this repo |
| `packages/` | Publishable packages |
| `.github/workflows/` | CI, review, publish, and security workflows |
| `scripts/` | Repo utilities and validation scripts |
| `docs/` | Supporting docs such as performance notes |

### Current Packages

- `packages/cli`
- `packages/mcp`
- `packages/ai-sdk-plugin`
- `packages/langchain`

### Skill Surface

Prefer `.agents/skills/` as the canonical agent workflow surface. Current
shared skills:

- `grill-me` for stress-testing plans or designs
- `optimize-agents-md` for tightening repo instructions
- `review-guidelines` for code review conventions
- `tdd` for behavior-changing feature and fix work
- `typescript-lsp` for type-aware TypeScript symbol exploration

If legacy `.claude/skills/` content exists, do not treat it as the primary
source of truth unless the task explicitly depends on it.

---

## Commands

### Setup

```bash
bun install
cp .env.example .env
source .env
```

`.env` commonly needs `YDC_API_KEY`.

### Workspace Commands

```bash
bun run build
bun run check
bun run check:write
bun test
```

`bun run check` includes workspace dependency validation plus per-package
checks.

### Package Commands

Always run package commands from the repo root with `bun --cwd`. Never `cd`
into a package directory for local development commands.

```bash
bun --cwd packages/mcp test
bun --cwd packages/mcp check
bun --cwd packages/cli test
bun --cwd packages/cli check
bun --cwd packages/ai-sdk-plugin build
bun --cwd packages/langchain test
```

---

## Working Rules

### Package and Dependency Rules

- Package directory names must match the npm package suffix after
  `@youdotcom-oss/`.
- Internal workspace dependencies must use exact versions, not `workspace:*`,
  `^`, or `~`.
- The reusable publish workflow derives the package directory from the npm
  package name. Mismatches break releases.

### Code Rules

- Use relative imports inside a package.
- Use explicit `.ts` extensions on local imports.
- Keep public APIs documented with TSDoc.
- Prefer Bun-native APIs and Bun-first commands where practical.

### Git and GitHub Rules

- Use conventional commits.
- Use `gh` for PRs, issues, comments, and release inspection.
- When given a GitHub PR or issue URL for this repo, inspect it with `gh`
  rather than treating the URL as documentation.

Useful commands:

```bash
gh pr view <number>
gh pr diff <number>
gh api /repos/youdotcom-oss/dx-toolkit/pulls/<number>/comments
gh issue view <number>
```

---

## CI and Publishing

### Key Workflows

- `ci.yml` builds packages, runs checks, and runs tests with CI secrets
- `droid-review.yml` handles automated PR review
- `semgrep-ci.yml` runs security scanning
- `publish-*.yml` workflows publish individual packages through
  `_publish-package.yml`

### Publishing Rules

- Package releases are triggered through package-specific workflows such as
  `publish-cli.yml` or `publish-mcp.yml`.
- `_publish-package.yml` computes the next version, updates the target
  `package.json`, updates dependent workspace packages, publishes to npm, and
  creates a GitHub release tag in the form `{package}@v{version}`.
- Non-`main` branches automatically publish prereleases as `x.y.z-next.N`.
- `publish-mcp.yml` has extra steps for the hosted MCP surface:
  remote version update, production deploy trigger for stable releases, and
  `packages/mcp/server.json` registry publishing.

---

## Validation

Use the smallest validation set that proves the change:

- Docs or agent-instruction changes: `git diff --check` and stale-reference
  searches with `rg`
- Package-local code changes: targeted `bun --cwd packages/<name> ...`
- Cross-package or dependency changes: `bun run check` and `bun test`

Do not claim a workflow, package, or command exists without verifying it in the
repo first.

---

## Learnings

- 2026-02-23: Run package commands from the repo root with
  `bun --cwd packages/<name> ...`; do not `cd` into package directories for
  local development commands.
- 2026-02-23: Source `.env` before tests when they need `YDC_API_KEY`.
