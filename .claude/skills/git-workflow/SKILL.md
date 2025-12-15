---
name: git-workflow
description: Git workflow, branching strategy, commit conventions, and release process for dx-toolkit
---

# Git Workflow

Git workflow, branching strategy, commit conventions, and release process for dx-toolkit monorepo.

---

## Working with GitHub Issues and PRs

When given GitHub URLs for issues, PRs, or PR comments from this repository (`youdotcom-oss/dx-toolkit`), use the `gh` CLI to fetch information:

```bash
# View PR details
gh pr view 33

# View PR diff
gh pr diff 33

# Get PR comments (including review comments)
gh api /repos/youdotcom-oss/dx-toolkit/pulls/33/comments

# View issue details
gh issue view 123

# Comment on PR
gh pr comment 33 --body "Your comment here"
```

**Important**: The `GH_REPO` environment variable (set in `.env`) ensures `gh` commands target this repository by default, avoiding the need to specify `--repo` on every command.

## Branching Strategy

- `main` - Production branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## Syncing Branches

When syncing your local branch with remote changes, use fast-forward merge:

```bash
# Sync with remote changes (fast-forward merge)
git pull --ff origin <branch-name>

# Example
git pull --ff origin fix/workflows
```

**Do NOT use `git pull --rebase`** - Use fast-forward merge (`--ff`) for cleaner history.

## Git Hooks

Git hooks are automatically configured after `bun install`:

- **Pre-commit**: Runs Biome check and format-package on staged files
- **Setup**: `bun run prepare` (runs automatically with install)
- Git hooks enforce code quality standards across all packages

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
feat(mcp): add new search filter
fix(mcp): resolve timeout issue
docs: update monorepo setup guide
chore: update dependencies
```

### Scope Guidelines

- Use package name for package-specific changes: `(mcp)`, `(ai-sdk-plugin)`
- Omit scope for workspace-level changes: `chore: update root config`

## Version Format Convention

This monorepo follows standard Git tagging conventions with "v" prefix for releases:

- **Git tags**: `v{version}` (e.g., `v1.3.4`, `v1.4.0-next.1`)
- **GitHub releases**: `v{version}` (e.g., `Release v1.3.4`)
- **package.json**: `{version}` (no "v" prefix, e.g., `1.3.4`)
- **npm package**: `{version}` (no "v" prefix, e.g., `1.3.4`)

### When triggering the publish workflow

- Enter version WITHOUT "v" prefix: `1.3.4` (not `v1.3.4`)
- The workflow automatically adds "v" for Git tags
- Validation checks prevent accidental "v" prefix in input

### Example

```bash
# Correct workflow input
Version: 1.3.4

# Results in:
# - Git tag: v1.3.4
# - package.json: "version": "1.3.4"
# - npm package: @youdotcom-oss/mcp@1.3.4
```

This convention follows industry standards used by Node.js and most major projects.

## Best Practices

1. **Always use conventional commits** - Enables automated changelog generation
2. **Test before committing** - Pre-commit hooks enforce quality, but test manually first
3. **Keep commits focused** - One logical change per commit
4. **Write clear messages** - Describe what and why, not how
5. **Use fast-forward merges** - Cleaner history than rebasing
6. **Review gh CLI output** - Verify commands target correct repository

## Related Resources

- Conventional Commits: https://www.conventionalcommits.org/
- GitHub CLI: https://cli.github.com/
- Root AGENTS.md: Git Workflow section
