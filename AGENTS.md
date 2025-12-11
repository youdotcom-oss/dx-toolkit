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
│       ├── _publish-package.yml     # Reusable workflow for publishing packages
│       ├── ci.yml                   # Run lint test to validate libraries
│       ├── code-review.yml          # Agentic code for internal contributors
│       ├── external-code-review.yml # Agentic code for external contributors
│       └── publish-mcp.yml          # Publish mcp server and trigger remote deployment
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
- **Version Control**: Git
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

**Dependency Structure for Pure TypeScript Packages**:

Some packages (like `@youdotcom-oss/mcp`) serve dual purposes:
1. **Library consumption** - Users import utilities/schemas from the package
2. **Server/CLI** - Pre-built binaries or remote deployments

For pure TypeScript packages where source is published directly, all dependencies are listed in `dependencies`:

```json
{
  "dependencies": {
    "zod": "^4.1.13",
    "@hono/mcp": "^0.2.0",
    "@modelcontextprotocol/sdk": "^1.24.3",
    "hono": "^4.10.7"
  }
}
```

**Why all in dependencies?**
- Package publishes TypeScript source files (not compiled JavaScript)
- Library consumers need access to all type definitions and dependencies
- Users importing from the package require the full dependency tree
- Pre-built binaries (`bin/stdio.js`) are compiled separately with dependencies bundled

**Example**: The MCP server package exports TypeScript utilities and schemas (`src/utils.ts`) directly. The STDIO binary (`bin/stdio.js`) is pre-compiled for standalone execution.

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

**Numeric Separators**: Use underscores for large numbers (improves readability)

```ts
// ✅ Preferred
const timeout = 90_000; // 90 seconds
const maxSize = 1_000_000; // 1 million
const largeNumber = 1_234_567_890;

// ❌ Avoid
const timeout = 90000;
const maxSize = 1000000;
const largeNumber = 1234567890;
```

**No Unused Exports**: All exports must be actively used

```bash
# Before adding exports, verify usage:
grep -r "ExportName" packages/
```

**Prefer Bun APIs Over Node.js APIs**: Always use Bun-native APIs when available

```ts
// ✅ Preferred - Bun native APIs
import { $ } from 'bun';
import { heapStats } from 'bun:jsc';

// Path resolution (throws if not found - perfect for validation)
const path = Bun.resolveSync('./file.js', import.meta.dir);

// Shell commands
await $`ls -la`;
const output = await $`echo hello`.text();

// Sleep
await Bun.sleep(100);

// Garbage collection
Bun.gc(true);

// ❌ Avoid - Node.js APIs when Bun alternative exists
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
const path = require.resolve('./file.js');
await new Promise(resolve => setTimeout(resolve, 100));
```

**Why prefer Bun APIs?**
- Better performance (native implementation)
- Better TypeScript integration
- More predictable behavior in Bun runtime
- Clearer error messages (e.g., `Bun.resolveSync` throws with clear message)

**When Node.js APIs are acceptable:**
- No Bun equivalent exists
- Compatibility with Node.js runtime required
- Third-party package dependency requires it

**Resources:**
- [Bun Runtime Utils](https://bun.sh/docs/runtime/utils)
- [Bun Shell](https://bun.sh/docs/runtime/shell)

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

- `main` - Production branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Syncing Branches

When syncing your local branch with remote changes, use fast-forward merge:

```bash
# Sync with remote changes (fast-forward merge)
git pull --ff origin <branch-name>

# Example
git pull --ff origin fix/workflows
```

**Do NOT use `git pull --rebase`** - Use fast-forward merge (`--ff`) for cleaner history.

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

### Workflow Files

**`.github/workflows/publish-mcp.yml`** (MCP-specific workflow with deployment):
- Triggered: Manual via `workflow_dispatch`
- Note: This workflow includes remote deployment steps specific to the MCP package. Other packages use simpler publish workflows without deployment.
- Actions:
  1. Updates package version in packages/mcp/package.json
  2. Scans all workspace packages for dependencies on @youdotcom-oss/mcp
  3. Updates dependent packages with exact version (e.g., "1.4.0", no ^ or ~)
  4. Commits all version updates together
  5. Creates GitHub release
  6. Publishes to npm
  7. Triggers remote repository via `repository_dispatch` (for production deployments)
- Dependency Updates: Automatically updates workspace dependencies
- Deployment Architecture:
  - **update-remote-version** job: Sends `update-mcp-version` event to deployment repository
  - **deploy-production** job: Conditionally sends `deploy-mcp-production` event (only for stable releases)
  - Uses `DEPLOYMENT_REPO` secret to specify target repository
  - Actively verifies remote version update completion before deployment:
    - Polls every 20 seconds for up to 3 attempts (60s total)
    - Checks specific `update-version` job status using GitHub API
    - Only considers runs created within last 90 seconds
    - Fails fast if remote job fails or times out
  - Prereleases skip production deployment (`is_prerelease == 'true'`)
- Required Secrets:
  - `PUBLISH_TOKEN`: For git operations bypassing branch protection
  - `RELEASE_ADMIN_TOKEN`: For triggering workflows on remote repository
  - `DEPLOYMENT_REPO`: Repository to trigger (format: `owner/repo`)

**`.github/workflows/_publish-package.yml`** (Reusable workflow for all packages):
- Reusable workflow for publishing packages to npm
- Called by package-specific publish workflows (e.g., `publish-mcp.yml`)
- Handles version updates, npm publishing, and GitHub releases
- Uses NPM Trusted Publishing (OIDC) for authentication
- Requires `PUBLISH_TOKEN` secret for git operations on protected branches
- Note: Most packages only use this workflow. MCP adds deployment steps in its specific workflow.

**Remote Repository Requirements** (MCP package deployment only):

The remote repository (specified in `DEPLOYMENT_REPO`) must have workflows that listen for `repository_dispatch` events.
This is only used for the MCP package which requires remote deployment infrastructure:

1. **`update-version.yml`** - Listens for `update-mcp-version` event:
   - Receives version in `client_payload.version`
   - Updates package dependency to published version
   - Commits changes to main branch
   - Creates GitHub release with changelog

2. **`deploy-prod.yml`** - Listens for `deploy-mcp-production` event:
   - Receives version in `client_payload.version`
   - Builds Docker image with version tag
   - Deploys to production environment (multi-region)

**`.github/workflows/ci.yml`**:
- Runs lint and test checks to validate all packages
- Triggers on pull requests and pushes to main

**`.github/workflows/code-review.yml`**:
- Automated code review for internal contributors
- Provides AI-powered code analysis and suggestions

**`.github/workflows/external-code-review.yml`**:
- Manually triggered agentic review for external contributors
- Same analysis as internal review with additional security checks

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
1. **Package configuration** - Name, npm package name
2. **Metadata** - Description and keywords
3. **Automatic setup**:
   - Creates package directory structure
   - Generates all configuration files (package.json, tsconfig.json, biome.json, .gitignore)
   - Creates source files with templates
   - Generates documentation (README.md, AGENTS.md)
   - Creates publish workflow (`.github/workflows/publish-{package}.yml`)
4. **Post-creation checklist** - Manual steps for testing the package

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

## Package-Specific Documentation

For package-specific development details, see each package's AGENTS.md:

- **MCP Server**: [`packages/mcp/AGENTS.md`](./packages/mcp/AGENTS.md)
  - MCP tool development patterns
  - API integration details
  - Testing guidelines
  - Architecture diagrams

### Documentation Standards

**IMPORTANT EXCEPTION**: The root `README.md` (at monorepo level) is an exception to these guidelines. It serves as a project overview and does not follow the package consumption tone. These guidelines apply to **package-level documentation only** (e.g., `packages/mcp/README.md`, `packages/ai-sdk-plugin/README.md`).

All packages maintain two distinct documentation files with specific tone requirements:

#### README.md - User-Facing Documentation

**Audience**: End users (developers integrating the package)

**Tone Characteristics**:
- Encouraging and accessible - "Get up and running in 4 quick steps"
- Task-focused and solution-oriented - "No installation, always up-to-date"
- Second-person voice - Use "you", "your" consistently
- Active imperatives - "Choose your setup", "Test your installation"

**Content Requirements**:
- Maximum 4 steps in "Getting started" section
- Natural language examples in quotes
- Progressive disclosure with collapsible sections
- Problem-solution format for troubleshooting
- Emphasize immediate value and ease of use

**Language Patterns**:
| ✅ Do | ❌ Don't |
|-------|----------|
| "Get up and running in 3 quick steps" | "Installation procedure requires..." |
| "No installation required" | "This package is hosted remotely" |
| "Your agent will automatically..." | "The system executes..." |
| "Just describe what you want" | "Invoke the tool with parameters" |

#### AGENTS.md - Developer Documentation

**Audience**: Developers, contributors, AI coding agents

**Tone Characteristics**:
- Directive and technical - "Always use arrow functions for declarations"
- Absolute constraints - "NEVER bypass git hooks"
- Imperative explanatory - Side-by-side code examples
- Enforcement language - "All exports must be actively used"

**Content Requirements**:
- Clear audience disclaimer at top
- Sequential workflow structure (setup → code → develop → deploy)
- Side-by-side code comparisons (✅/❌)
- File path references with line numbers
- Symptom/solution format for troubleshooting
- Architecture diagrams where relevant

**Language Patterns**:
| ✅ Do | ❌ Don't |
|-------|----------|
| "Always use arrow functions" | "We recommend arrow functions" |
| "NEVER bypass git hooks" | "Consider keeping hooks enabled" |
| "All exports must be used" | "Try to avoid unused exports" |
| "Check pattern: `^[a-z]+$`" | "Names should be lowercase" |

#### Quick Reference Comparison

| Aspect | README.md | AGENTS.md |
|--------|-----------|-----------|
| **Audience** | End users (integrators) | Developers (contributors) |
| **Tone** | Encouraging, accessible | Directive, technical |
| **Voice** | Active, second-person | Imperative, explanatory |
| **Examples** | Natural language queries | Code patterns with ✅/❌ |
| **Structure** | Progressive disclosure | Sequential workflows |
| **Language** | "Works everywhere", "just", "simply" | "Always", "never", "must" |

#### Validation Checklist

Before publishing package documentation:

**README.md:**
- [ ] Has 4-step "Getting started" section
- [ ] Uses encouraging language ("quick", "easy", "just")
- [ ] Provides natural language examples
- [ ] Uses collapsible sections for detailed config
- [ ] Includes simple test queries
- [ ] Emphasizes immediate value
- [ ] Uses second-person voice throughout
- [ ] Avoids technical jargon in main flow

**AGENTS.md:**
- [ ] Starts with clear audience disclaimer
- [ ] Uses directive language (always/never)
- [ ] Includes file path references
- [ ] Provides side-by-side code examples (✅/❌)
- [ ] Contains architecture diagrams where relevant
- [ ] Uses symptom/solution format for troubleshooting
- [ ] Specifies exact patterns with regex/commands
- [ ] Cross-references to line numbers where appropriate

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

# Verify build output
ls -la bin/
```

## Contributing

### For Internal Contributors

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes in appropriate package: `cd packages/mcp`
3. Test changes: `bun test` and `bun run check`
4. Commit with conventional commits: `git commit -m "feat(mcp): ..."`
5. Push and create PR to `main`
6. Wait for code review and CI checks to pass
7. Merge to main after approval

### For External Contributors

1. Fork this repository (`youdotcom-oss/dx-toolkit`)
2. Create feature branch and make changes
3. Sign CLA when prompted by bot
4. Open pull request with your changes
5. Address feedback from maintainers
6. After approval, maintainers will merge and include in next release

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

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
- Local files: `.ts` extension
- NPM packages: `.js` extension
- JSON files: `.json` with import assertion

## Support

- **Package Issues**: See package-specific AGENTS.md
- **Issues and Contributions**: Create issue in [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
