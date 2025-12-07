---
description: Development guidelines for You.com DX Toolkit using Bun workspaces.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json"
alwaysApply: false
---

# You.com DX Toolkit Development Guide

Open-source toolkit enabling developers to integrate You.com's AI capabilities into their workflows. Built as a Bun workspace containing packages for MCP servers, AI SDK plugins, evaluation harnesses, and Claude Code skills.

> **For a user-focused quick start**, see the [root README.md](./README.md). This guide (AGENTS.md) is for internal maintainers and contributors who need comprehensive development details.

---

## Monorepo Structure

```
dx-toolkit/
├── packages/
│   └── mcp/               # MCP Server package (@youdotcom-oss/mcp)
│       ├── src/           # Source code
│       ├── bin/           # Compiled output
│       ├── docs/          # API documentation
│       ├── tests/         # Tests
│       ├── README.md      # User documentation
│       ├── AGENTS.md      # Package-specific dev guide
│       └── package.json   # Package config
├── .github/
│   └── workflows/         # CI/CD workflows
│       ├── _publish-package         # Reusable workflow for publishing packages
│       ├── ci         # Run lint test to validate libraries
│       ├── code-review.yml # Agentic code for internal contributors
│       ├── external-code-review.yml # Agentic code for external contributors
│       ├── publish-mcp.yml              # publish mcp server and trigger remote deployment
│       ├── semgrep.yml              # Scan code for vuneralbilities
├── scripts/               # CI scripts
├── package.json           # Workspace root config
├── bun.lock              # Workspace lock file (root only)
└── AGENTS.md             # This file (monorepo dev guide)
```

### Package Naming Convention

All packages must follow this naming rule:

**Rule**: Package directory name MUST match the npm package name after `@youdotcom-oss/`

**Examples**:
- NPM: `@youdotcom-oss/mcp` → Directory: `packages/mcp` ✅
- NPM: `@youdotcom-oss/ai-sdk-plugin` → Directory: `packages/ai-sdk-plugin` ✅
- NPM: `@youdotcom-oss/eval` → Directory: `packages/eval` ✅

**Validation**: The publish workflow automatically derives the package directory from the npm package name. Mismatches will cause deployment failures.

**Current packages**:
- `@youdotcom-oss/mcp` in `packages/mcp/`

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **Workspace Manager**: Bun workspaces
- **Code Quality**: Biome 2.3.8 (linter + formatter)
- **Type Checking**: TypeScript 5.9.3
- **Git Hooks**: lint-staged 16.2.7
- **Version Control**: Git with bidirectional Git Subtree sync
- **GitHub CLI**: `gh` for PR/issue management (recommended)

## Quick Start

### Setup Environment

```bash
# Clone repository
git clone git@github.com:youdotcom-oss/dx-toolkit.git
cd dx-toolkit

# Install dependencies (installs for all packages)
bun install

# Set up API key (for running MCP server)
echo "export YDC_API_KEY=your-actual-api-key-here" > .env

source .env
```

**GitHub CLI**: Install `gh` CLI for working with PRs and issues:
- macOS: `brew install gh`
- Linux: [Installation guide](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)
- Windows: [Installation guide](https://github.com/cli/cli#windows)
- Authenticate: `gh auth login`

### Monorepo Commands

```bash
# Build all packages
bun run build

# Test all packages
bun test

# Run all quality checks (biome + types + package format)
bun run check

# Auto-fix all issues across all packages
bun run check:write

# MCP server specific commands
bun run dev:mcp            # Start MCP server in STDIO mode
bun run start:mcp          # Start MCP server in HTTP mode
```

### Package-Specific Commands

All packages in this monorepo support the following standard commands when run from the package directory:

```bash
cd packages/<package-name>

bun run dev              # Start package in development mode
bun start                # Start package in production mode
bun test                 # Run package tests
bun run check            # Check package code quality
bun run check:write      # Auto-fix package issues
```

**From Root**: You can also run package-specific commands from the repository root:

```bash
# MCP Server
bun run dev:mcp          # Start MCP server in STDIO mode
bun run start:mcp        # Start MCP server in HTTP mode
bun run test:mcp         # Test MCP server only

# Future packages will follow the same pattern:
# bun run dev:<package>
# bun run start:<package>
# bun run test:<package>
```

**Example - Working with MCP Server**:

```bash
# From root
bun run dev:mcp          # Quick start

# Or from package directory for more control
cd packages/mcp
bun run dev              # Development mode (STDIO)
bun start                # Production mode (HTTP on port 4000)
bun test                 # Run package tests
bun run check            # Verify code quality
```

## Code Style

This monorepo uses [Biome](https://biomejs.dev/) for automated code formatting and linting across all packages.

### Monorepo-Specific Patterns

**Import Paths**: Use relative paths within packages, not workspace aliases

```ts
// ✅ Correct - relative path
import { foo } from '../utils.js';

// ❌ Avoid - workspace aliases not configured
import { foo } from '@youdotcom-oss/utils';
```

**Package References**: Use exact versions for published packages

```json
{
  "dependencies": {
    "@youdotcom-oss/mcp": "1.3.4"
  }
}
```

**IMPORTANT**: Do NOT use `workspace:*` for inter-package dependencies. These packages are published to npm and must use exact version numbers (no `^` or `~` prefixes). The publish workflow automatically updates dependent packages when a new version is released.

**Version Update Automation**: When you add a cross-package dependency:
1. Manually add it with the current version (e.g., `"@youdotcom-oss/mcp": "1.3.4"`)
2. The publish workflow will automatically update this version when the dependency is published
3. You do NOT need to manually update version numbers after the initial dependency is added
4. The workflow scans all workspace packages and updates any dependencies on the published package

**Dependency Structure for Dual-Purpose Packages**:

Some packages (like `@youdotcom-oss/mcp`) serve dual purposes:
1. **Library consumption** - Users import utilities/schemas from the package
2. **Server/CLI** - Pre-built binaries or remote deployments

For these packages, dependencies should be structured as:

```json
{
  "dependencies": {
    "zod": "^4.1.13"  // Only runtime deps needed by library consumers
  },
  "devDependencies": {
    "@modelcontextprotocol/sdk": "1.24.3",  // Server deps (bundled into binaries)
    "hono": "^4.10.7",                       // HTTP server (bundled into binaries)
    "@hono/mcp": "0.2.0"                     // Server deps (bundled into binaries)
  }
}
```

**Why?**
- Library consumers (importing from `main`) only need minimal deps (e.g., `zod` for types)
- Server/CLI users consume pre-built binaries that bundle all dependencies
- Docker builds compile everything into standalone binaries
- This keeps the dependency footprint minimal for library consumers

**Example**: The MCP server package exports utility functions and schemas (`src/main.ts`) that only need `zod`, while the server functionality (`bin/stdio.js`, `bin/http`) is pre-compiled with all dependencies bundled.

**Lock Files**: Only root `bun.lock` is committed

- Root `.gitignore` allows root `bun.lock`
- Package `.gitignore` files ignore all lock files (including `bun.lock`)
- Workspace manages all dependencies via root lock file

### Universal Code Patterns

**Arrow Functions**: Always use arrow functions for declarations

```ts
// ✅ Preferred
export const fetchData = async (params: Params) => { ... };

// ❌ Avoid
export async function fetchData(params: Params) { ... }
```

**No Unused Exports**: All exports must be actively used

```bash
# Before adding exports, verify usage:
grep -r "ExportName" packages/
```

## Git Workflow

### Working with GitHub Issues and PRs

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

### Branching Strategy

- `main` - Production branch (syncs to OSS repos)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `sync-oss-<package>-pr-<number>` - OSS PR sync branches (auto-created)

### Git Hooks

Git hooks are automatically configured after `bun install`:

- **Pre-commit**: Runs Biome check and format-package on staged files
- **Setup**: `bun run prepare` (runs automatically with install)
- Git hooks enforce code quality standards across all packages

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
feat(mcp): add new search filter
fix(mcp): resolve timeout issue
docs: update monorepo setup guide
chore: update dependencies
```

**Scope Guidelines**:
- Use package name for package-specific changes: `(mcp)`, `(ai-sdk-plugin)`
- Omit scope for workspace-level changes: `chore: update root config`

### Version Format Convention

This monorepo follows standard Git tagging conventions with "v" prefix for releases:

- **Git tags**: `v{version}` (e.g., `v1.3.4`, `v1.4.0-next.1`)
- **GitHub releases**: `v{version}` (e.g., `Release v1.3.4`)
- **package.json**: `{version}` (no "v" prefix, e.g., `1.3.4`)
- **npm package**: `{version}` (no "v" prefix, e.g., `1.3.4`)

**When triggering the publish workflow:**
- Enter version WITHOUT "v" prefix: `1.3.4` (not `v1.3.4`)
- The workflow automatically adds "v" for Git tags
- Validation checks prevent accidental "v" prefix in input

**Example:**
```bash
# Correct workflow input
Version: 1.3.4

# Results in:
# - Git tag: v1.3.4
# - package.json: "version": "1.3.4"
# - npm package: @youdotcom-oss/mcp@1.3.4
```

This convention follows industry standards used by Node.js  and most major projects.

## Monorepo Architecture

### Bidirectional Git Subtree Sync

This monorepo uses Git Subtree for bidirectional sync between private monorepo and public OSS repositories.

**Private → Public (Release)**:
```bash
# Triggered by: publish-mcp.yml workflow
git subtree split --prefix=packages/mcp -b oss-mcp-temp
git push oss-mcp oss-mcp-temp:main --force
```

**Public → Private (OSS Contributions)**:
```bash
# Triggered by: sync-from-oss-pr.yml workflow (manual)
git subtree pull --prefix=packages/mcp oss-mcp pr-branch
# Creates: sync-oss-mcp-pr-<number> branch
# Opens: PR in private monorepo for review
```

### OSS Contribution Workflow

1. **External contributor** opens PR in OSS repo (`youdotcom-oss/mcp-server`)
2. **CLA bot** checks if contributor signed CLA
3. **Maintainer** reviews OSS PR, triggers sync workflow with PR number
4. **Sync workflow** creates branch in private monorepo with OSS commits
5. **Internal review** happens in private monorepo PR
6. **Contributor updates** OSS PR → maintainer re-syncs (manual or auto)
7. **Merge to main** via GitHub squash merge
8. **Publish workflow** releases new version, syncs to OSS repo
9. **Auto-close workflow** closes OSS PR with attribution

**Important**: Do not push directly to sync branches (`sync-oss-*-pr-*`). These branches are managed by the sync workflow and use `--force-with-lease` to prevent accidental overwrites. If you need to make changes, either:
- Comment on the OSS PR and ask the contributor to update it
- Make changes in the private monorepo PR after the sync completes

### Workflow Files

**`.github/workflows/publish-mcp.yml`**:
- Triggered: Manual via `workflow_dispatch` or on release
- Actions:
  1. Updates package version in packages/mcp/package.json
  2. Scans all workspace packages for dependencies on @youdotcom-oss/mcp
  3. Updates dependent packages with exact version (e.g., "1.4.0", no ^ or ~)
  4. Commits all version updates together
  5. Creates GitHub release in private repo
  6. Syncs to OSS via git subtree split
  7. Creates GitHub release in OSS repo
  8. Publishes to npm
- Git Subtree: Lines 104-130
- Dependency Updates: Lines 61-113 (automatically updates workspace dependencies)

**`.github/workflows/sync-from-oss-pr.yml`**:
- Triggered: Manual via `workflow_dispatch` with package + PR number
- Actions: Fetches OSS PR, creates branch via git subtree pull, opens monorepo PR
- Git Subtree: Lines 130-162
- No `--squash` flag to preserve individual commits

**`.github/workflows/close-oss-pr-after-release.yml`**:
- Triggered: After `publish-mcp.yml` completes successfully
- Actions: Finds recently merged sync PRs, closes corresponding OSS PRs with attribution

**`.github/workflows/deploy-prod.yml`** & **`deploy-staging.yml`**:
- Docker builds from `packages/mcp/` directory
- Updated for monorepo structure (lines 61, 65)

## Development Workflow

### Adding a New Package

Use the `/create-package` command to interactively create new packages:

**For Claude Code users:**
```bash
/create-package
```

**For other AI coding agents:**
Ask your agent to read and follow the instructions in `.claude/commands/create-package.md`

The command will guide you through:
1. **Package configuration** - Name, type (library/CLI/server/dual-purpose), npm package name, OSS repo
2. **Optional features** - Docker support, HTTP server, CLI binary
3. **Metadata** - Description and keywords
4. **Automatic setup**:
   - Creates package directory structure
   - Generates all configuration files (package.json, tsconfig.json, biome.json, .gitignore)
   - Creates source files with templates
   - Generates documentation (README.md, AGENTS.md, CONTRIBUTING.md)
   - Creates publish workflow (`.github/workflows/publish-{package}.yml`)
   - Updates sync and close workflows for OSS integration
5. **Post-creation checklist** - Manual steps for OSS repo creation and GitHub secrets

**Manual Alternative** (if not using Claude Code):

```bash
# Create package directory
mkdir -p packages/new-package

# Initialize package
cd packages/new-package
bun init

# Copy configuration from existing package
cp ../mcp/{.gitignore,tsconfig.json,biome.json} .

# Update root package.json workspaces (if needed)
# Workspaces already includes "packages/*"

# Install dependencies from root
cd ../..
bun install
```

**Important**: When manually creating packages, you must also:
- Create `.github/workflows/publish-{package}.yml` workflow
- Update `.github/workflows/sync-from-oss-pr.yml` with new package mapping
- Update `.github/workflows/close-oss-pr-after-release.yml` with new package mapping
- See `.claude/commands/create-package.md` for detailed manual instructions

### Working on Packages

```bash
# Make changes in a package
cd packages/mcp
# ... edit files ...

# Test your changes
bun test

# Check code quality
bun run check

# Run from root to test all packages
cd ../..
bun test
bun run check
```

### Code Quality Commands

```bash
# Workspace-level (runs for all packages)
bun run check                    # All checks (biome + types + package)
bun run check:write              # Auto-fix all issues
bun run build                    # Build all packages
bun test                         # Test all packages

# Package-level
cd packages/mcp
bun run check                    # Check specific package
bun run check:write              # Fix specific package
bun run build                    # Build specific package
bun test                         # Test specific package
```

## Deployment

### Docker Builds

**Docker files are located at the repository root** for production deployments:

- `Dockerfile` - Multi-stage build for MCP server HTTP mode
- `.dockerignore` - Excludes unnecessary files from build context

**Build from repository root:**

```bash
# Production build (from root)
docker build -t youdotcom-mcp-server .

# Or use deployment scripts
./scripts/deploy_staging.sh
./scripts/deploy_prod.sh us-east-1
```

**Docker Build Context**: CI/CD workflows build from the **repository root** (not package directory). This allows:
- Proper workspace dependency resolution using root `bun.lock`
- Access to all workspace packages if needed
- Single source of truth for Docker configuration

**Note for OSS contributors**: Docker files are excluded from package sync to OSS repositories. They are only used for internal production deployments.

### Deployment Scripts

Scripts automatically navigate to correct paths in monorepo:

```bash
# scripts/deploy_prod.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT/k8s/mcp-server"
```

## Package-Specific Documentation

For package-specific development details, see each package's AGENTS.md:

- **MCP Server**: [`packages/mcp/AGENTS.md`](./packages/mcp/AGENTS.md)
  - MCP tool development patterns
  - API integration details
  - Testing guidelines
  - Architecture diagrams

## Troubleshooting

### Workspace Issues

**Symptom**: `bun install` fails or packages not found

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
bun install

# Verify workspace configuration
cat package.json | grep -A 3 "workspaces"
```

**Symptom**: TypeScript can't find package imports

**Solution**:
```bash
# Use relative paths, not workspace aliases
# ✅ import { foo } from '../utils.js'
# ❌ import { foo } from '@youdotcom-oss/utils'
```

### Build Issues

**Symptom**: Build fails in CI but works locally

**Solution**:
```bash
# Ensure you're building from correct directory
cd packages/mcp
bun run build

# Check GitHub Actions workflow paths
# deploy-prod.yml should have: cd $SERVICES_WORKSPACE/packages/mcp
```

### Git Subtree Issues

**Symptom**: Subtree split/pull fails with conflicts

**Solution (Automated):**

```bash
# For maintainers: ensure branch is up to date
git fetch origin main
git rebase origin/main

# Re-run sync workflow with updated branch
# GitHub Actions: sync-from-oss-pr.yml > Run workflow
```

**Solution (Manual Resolution):**

If automated re-sync doesn't resolve conflicts:

```bash
# Inspect what changed in both repos
git diff packages/mcp
git fetch oss-mcp <branch>
git diff HEAD oss-mcp/<branch> -- packages/mcp

# Manually merge if needed
git subtree merge --prefix=packages/mcp oss-mcp/<branch>

# Resolve conflicts, then commit
git add packages/mcp
git commit -m "chore: resolve subtree merge conflicts"
```

## Contributing

### For Internal Contributors

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes in appropriate package: `cd packages/mcp`
3. Test changes: `bun test` and `bun run check`
4. Commit with conventional commits: `git commit -m "feat(mcp): ..."`
5. Push and create PR to `main`
6. After merge, changes sync to OSS repos via publish workflow

### For External OSS Contributors

1. Fork the OSS repository (`youdotcom-oss/mcp-server`)
2. Create feature branch and make changes
3. Sign CLA when prompted by bot
4. Open PR in OSS repository
5. Maintainer will sync to private monorepo for review
6. Address feedback in OSS PR (will auto-sync)
7. After approval, PR will be merged and included in next release
8. Your commits preserved via git subtree split

See [CONTRIBUTING.md](./packages/mcp/CONTRIBUTING.md) for detailed guidelines.

## Bun Runtime

This monorepo uses Bun (>= 1.2.21) instead of Node.js:

```bash
bun <file>       # Run TypeScript directly
bun install      # Install dependencies for all packages
bun test         # Run tests for all packages
bun run build    # Build all packages
```

**Workspace Commands**:
- `bun run --filter '*' <script>` - Run script in all packages
- `bun --cwd packages/mcp <script>` - Run script in specific package

**Import Extensions** (enforced by Biome):
- Local files: `.js` extension (even for `.ts` files)
- NPM packages: Standard imports
- JSON files: `.json` with import assertion

## Support

- **Package Issues**: See package-specific AGENTS.md
- **Monorepo Issues**: Create issue in private repo
- **OSS Contributions**: See OSS repo issues
- **Email**: support@you.com
