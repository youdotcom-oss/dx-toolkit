---
description: Development guidelines for You.com DX Toolkit using Bun workspaces.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json"
alwaysApply: false
---

# You.com DX Toolkit Development Guide

Open-source toolkit enabling developers to integrate You.com's AI capabilities into their workflows. Built as a Bun workspace containing packages for MCP servers, AI SDK plugins, evaluation harnesses, and Claude Code skills.

> **For a user-focused quick start**, see the [root README.md](./README.md). This guide (AGENTS.md) is for internal maintainers and contributors who need comprehensive development details.

## Rules and Skills Organization

This monorepo uses both rules (`.claude/rules/`) and skills (`.claude/skills/`) for efficient knowledge organization:

**Rules** (in `.claude/rules/`) - Universal development patterns:
- **code-patterns.md** - Universal code patterns (arrow functions, Bun APIs, test patterns, error handling, type guards)
- **git-workflow.md** - Git conventions (branching, commits, versioning, gh CLI usage)
- **testing.md** - Performance monitoring system (measurements, thresholds, regression handling)
- **workflows.md** - Package and plugin creation workflows (implementation, testing, publishing)

**Skills** (in `.claude/skills/`) - Package-specific patterns:
- **documentation** - Documentation standards (thin AGENTS.md philosophy, TSDoc strategy, README.md tone)
- **mcp-patterns** - MCP server patterns (Zod schemas, error handling, logging, response format)
- **ai-sdk-patterns** - Vercel AI SDK patterns (input schemas, API key handling, response format)
- **teams-ai-patterns** - Teams.ai patterns (Memory API, Anthropic SDK, MCP client setup)

**Benefits**:
- **Reduced overhead**: Rules use plain markdown without frontmatter metadata
- **Clear organization**: Rules for universal patterns, skills for package-specific patterns
- **Token efficiency**: Simpler structure, easier discovery
- **Single source of truth**: Update patterns once, referenced everywhere
- **Maintainability**: Consistent pattern across the monorepo

Throughout this guide, you'll see references like:
> **For universal code patterns**, see `.claude/rules/code-patterns.md`

These indicate that detailed information is available in the referenced rule file.

---

## Monorepo Structure

```
dx-toolkit/
├── .claude-plugin/
│   └── marketplace.json   # Plugin marketplace manifest
├── packages/
│   └── mcp/               # MCP Server package (@youdotcom-oss/mcp)
│       ├── src/           # Source code
│       ├── bin/           # Compiled output
│       ├── docs/          # API documentation
│       ├── tests/         # Tests
│       ├── README.md      # User documentation
│       └── package.json   # Package config
├── plugins/               # Claude Code plugins (NOT published to npm)
│   └── teams-anthropic-integration/
│       ├── .claude-plugin/
│       ├── commands/
│       ├── src/
│       ├── tests/
│       ├── templates/
│       ├── reference/
│       ├── AGENTS.md      # Plugin instructions
│       ├── README.md      # Plugin docs
│       └── package.json   # private: true
├── tests/                 # Root-level marketplace validation
├── .github/
│   └── workflows/         # CI/CD workflows
│       ├── _publish-package.yml        # Reusable workflow for publishing packages
│       ├── ci.yml                      # Run lint test to validate libraries
│       ├── code-review.yml             # Agentic code for internal contributors
│       ├── external-code-review.yml    # Agentic code for external contributors
│       ├── publish-mcp.yml             # Publish mcp server and trigger remote deployment
│       └── validate-marketplace.yml    # Weekly plugin marketplace validation
├── scripts/               # CI scripts
├── docs/
│   └── MARKETPLACE.md     # Plugin marketplace documentation
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

## Claude Code Skills Marketplace

This repository serves as a **Claude Code Skills Marketplace**, providing cross-platform skills for enterprise integrations, AI SDK workflows, and agent SDK integrations.

### Marketplace vs Packages

**Key Distinction**:
- **`packages/`** - npm packages (published to npm registry)
- **`plugins/`** - Skills for marketplace distribution (accessed via git, NOT published to npm)
- **`.claude/skills/`** - Project-specific development skills (code patterns, documentation, git workflow)

### Skill Architecture

```
plugins/{skill-name}/
├── skills/
│   └── {skill-name}.md                 # Agent-skills-spec format (replaces AGENTS.md + commands/)
├── src/
│   └── integration.ts                  # Core integration code (validated)
├── tests/
│   └── integration.spec.ts             # Bun tests (runs in CI)
├── templates/
│   └── *.ts                            # Code templates (shipped as-is)
├── reference/
│   └── *.md                            # Reference documentation
├── package.json                        # private: true, Bun workspace
├── tsconfig.json                       # TypeScript config
├── README.md                           # Human-readable docs
└── LICENSE                             # MIT license
```

**Skill File Format** (agent-skills-spec):
- Located in `skills/{skill-name}.md` subdirectory
- YAML frontmatter (name, description, license, compatibility, metadata)
- Markdown body with workflow, templates, validation checklist, troubleshooting
- Single source of truth for skill content
- Max 1024 chars for description in frontmatter

### Package Patterns vs Plugin Skills

**Package-specific patterns** (in `.claude/skills/`):
- **Audience**: Developers contributing to packages
- **Purpose**: Package-specific development patterns (e.g., MCP schemas, AI SDK plugin patterns)
- **Tone**: Directive and technical ("Always use...", "NEVER bypass...")
- **Content**: Framework-specific patterns, domain rules unique to package integration
- **Distribution**: Part of repository, referenced from root AGENTS.md
- **Examples**: `.claude/skills/mcp-patterns/`, `.claude/skills/teams-anthropic-patterns/`

**Plugin skills** (in `plugins/*/skills/`):
- **Audience**: End users integrating packages into their applications
- **Purpose**: Interactive integration workflows for specific platforms/frameworks
- **Format**: Agent-skills-spec (YAML frontmatter + Markdown)
- **Content**: Step-by-step workflow, templates, validation, troubleshooting
- **Distribution**: Accessed via git clone/pull, listed in marketplace.json
- **Examples**: `plugins/ai-sdk-integration/skills/`, `plugins/teams-anthropic-integration/skills/`

### Skill Workspace Integration

Skills are part of the Bun workspace for local validation:

```json
// Root package.json
{
  "workspaces": ["packages/*", "plugins/*"]
}
```

**Benefits**:
- ✅ Validate core integration code works locally
- ✅ Run Bun tests in CI to ensure integration pattern is correct
- ✅ Apply same quality checks (Biome, TypeScript)
- ✅ Skills distributed via git (no build artifacts)
- ✅ Templates shipped as-is (not individually validated)

### Skill Naming Convention

Skill directories must follow this naming rule:

**Rule**: Skill directory name MUST match the skill name in SKILL.md frontmatter

**Examples**:
- Skill name: `teams-anthropic-integration` → Directory: `plugins/teams-anthropic-integration` ✅
- Skill name: `ai-sdk-integration` → Directory: `plugins/ai-sdk-integration` ✅

**Validation**: Marketplace tests validate skill names match directory names.

**Current skills**:
- `teams-anthropic-integration` in `plugins/teams-anthropic-integration/`
- `ai-sdk-integration` in `plugins/ai-sdk-integration/`
- `claude-agent-sdk-integration` in `plugins/claude-agent-sdk-integration/`
- `openai-agent-sdk-integration` in `plugins/openai-agent-sdk-integration/`

### Skill Commands

```bash
# From root - test specific skill
bun --cwd plugins/teams-anthropic-integration test

# From root - check specific skill
bun --cwd plugins/teams-anthropic-integration run check

# From root - test all skills
bun run --filter 'plugins/*' test

# From skill directory
cd plugins/teams-anthropic-integration
bun test
bun run check
```

### Distribution Strategy

**Primary Distribution**: Skills are distributed via git

**Access Pattern**:
- Users clone/pull the repository: `git clone https://github.com/youdotcom-oss/dx-toolkit.git`
- Skills are in `plugins/` directory
- AI agents read SKILL.md files directly from filesystem
- No installation script needed

**Marketplace Configuration**:
```json
{
  "skills": [
    {
      "name": "ai-sdk-integration",
      "version": "0.2.0",
      "path": "./plugins/ai-sdk-integration/skills/ai-sdk-integration.md",
      "publicUrl": "https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/ai-sdk-integration"
    }
  ]
}
```

**Marketplace Versioning**:
- Format: Semantic versioning (e.g., `0.2.0`)
- Incremented: When skills or marketplace structure changes
- Indicates: Marketplace schema version

**Development Flow**:
1. Develop in `dx-toolkit/plugins/{skill-name}/`
2. Create/update SKILL.md with agent-skills-spec format
3. Test locally with Bun workspace
4. CI validates and tests on PR
5. Merge to main
6. Users pull latest changes to get updated skills

See [docs/MARKETPLACE.md](./docs/MARKETPLACE.md) for complete marketplace documentation.

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

**Dependency Structure**:

This monorepo uses two patterns for package dependencies based on publishing strategy:

**Pattern 1: Source-Published Packages** (e.g., `@youdotcom-oss/mcp`)

Packages that publish TypeScript source files directly. All dependencies in `dependencies`:

```json
{
  "main": "./src/main.ts",
  "exports": {
    ".": "./src/main.ts"
  },
  "files": ["./src/**", "!./src/**/tests/*"],
  "dependencies": {
    "zod": "^4.1.13",
    "@hono/mcp": "^0.2.0",
    "@modelcontextprotocol/sdk": "^1.24.3",
    "hono": "^4.10.7"
  }
}
```

**Why all in dependencies?**
- Library consumers need access to all type definitions
- Users importing from the package require the full dependency tree
- Pre-built binaries (if any) are compiled separately with dependencies bundled

**Pattern 2: Bundled Packages** (e.g., `@youdotcom-oss/ai-sdk-plugin`)

Packages that publish compiled bundles. Dependencies are bundled, externals in `dependencies` or `peerDependencies`:

```json
{
  "main": "./dist/main.js",
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "default": "./dist/main.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "bun run build:bundle && bun run build:types",
    "build:bundle": "bun build src/main.ts --outdir dist --target node --external ai",
    "build:types": "tsc --declaration --emitDeclarationOnly --noEmit false --outDir ./dist",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@youdotcom-oss/mcp": "1.3.8"
  },
  "peerDependencies": {
    "ai": "^5.0.0"
  }
}
```

**Why bundle?**
- Single file distribution (easier consumption)
- Reduced installation time (fewer dependencies to fetch)
- External dependencies (`--external`) avoid duplication in user's node_modules
- Peer dependencies ensure compatibility with user's AI framework version

**When to use each pattern:**
- **Source-published**: MCP servers, CLI tools, packages with optional compiled binaries
- **Bundled**: SDK plugins, framework integrations, libraries with external peer dependencies

**Cross-package dependencies**: Always use exact versions for workspace packages

```json
{
  "dependencies": {
    "@youdotcom-oss/mcp": "1.3.8"
  }
}
```

Packages depending on other workspace packages should use the **bundled pattern** to avoid dependency conflicts.

**Lock Files**: Only root `bun.lock` is committed

- Root `.gitignore` allows root `bun.lock`
- Workspace manages all dependencies via root lock file

### Universal Code Patterns

> **For universal code patterns** (arrow functions, Bun APIs, test patterns, error handling, etc.), see `.claude/rules/code-patterns.md`

This rule covers:
- Arrow functions and function declarations
- Numeric separators for readability
- Bun APIs over Node.js APIs
- Test patterns with `test()` vs `it()`
- Typed error handling with `err: unknown`
- Test retry configuration for API tests
- Test assertion anti-patterns to avoid
- Private class fields with `#` prefix
- Type guards over type casting
- When to use Zod for schema validation

The skill provides detailed examples, rationale, and best practices for each pattern

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

**IMPORTANT**: For complete package creation instructions, see [`.claude/commands/create-package.md`](./.claude/commands/create-package.md).

The create-package command provides:
- Interactive question flow for package configuration
- Validation of package names and npm availability
- Automated file creation (package.json, tsconfig.json, biome.json, source files, documentation)
- Automatic workflow generation for publishing
- Rollback on errors

**Quick usage:**

**For Claude Code users:**
```bash
/create-package
```

**For other AI coding agents:**
Read and follow the instructions in `.claude/commands/create-package.md`

**After package creation**, the command will:
1. Generate complete package structure with all required files
2. Create publish workflow at `.github/workflows/publish-{package}.yml`
3. Run `bun install` to register the package in the workspace
4. Display next steps with references to this file

### Post-Creation Workflow

> **For complete post-creation workflow** (implementation, testing, publishing), see `.claude/rules/workflows.md`

This rule covers:
- Implementing package logic with TSDoc comments
- Registering package documentation in root CLAUDE.md
- Adding performance monitoring (optional, API wrappers only)
- Testing locally before publishing
- Testing publish workflow with prerelease versions
- First stable release process

**Quick Reference**:

After creating a package with the create-package command:

1. **Implement Package Logic** - Edit `src/main.ts`, add tests, add TSDoc to exports
2. **Register Package Documentation** - Add AGENTS.md reference to root `CLAUDE.md`
3. **Add Performance Monitoring** (optional) - Only for API wrapper packages
4. **Test Locally** - Run `bun test` and `bun run check`
5. **Test Publish Workflow** - Use prerelease version (e.g., `0.1.0-next.1`)
6. **First Stable Release** - Publish version `0.1.0` to npm

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

For package-specific development patterns, see the corresponding skills:

- **MCP Server**: [`.claude/skills/mcp-patterns/`](./.claude/skills/mcp-patterns/)
  - Zod schema design patterns
  - Error handling conventions
  - Logging patterns
  - Response format standards
  - Testing strategies

- **Teams.ai Integration**: [`.claude/skills/teams-anthropic-patterns/`](./.claude/skills/teams-anthropic-patterns/)
  - Memory API usage patterns
  - Function calling conventions
  - Streaming response handling
  - Message transformation patterns

### Documentation Standards

> **For complete documentation standards** (README.md tone, thin AGENTS.md philosophy, TSDoc strategy), see `.claude/skills/documentation`

This skill covers:
- README.md user-facing tone (encouraging, accessible, second-person voice)
- **Thin AGENTS.md philosophy** (100-200 lines, heavy skill references, package-specific only)
- TSDoc API documentation strategy (no separate API.md files)
- Validation checklists for both documentation types
- Good vs bad examples showing thin vs bloated AGENTS.md

**Key principle**: Package AGENTS.md files should be minimal wrappers (100-200 lines) that reference skills for universal patterns and focus only on package-specific patterns.

**Quick Reference**:

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

## Performance Testing & Monitoring

> **For complete performance testing details** (centralized monitoring, running measurements, adding to new packages), see `.claude/rules/testing.md`

This rule covers:
- Centralized weekly monitoring architecture
- Running measurements locally and in CI
- Package thresholds and regression handling
- Adding performance monitoring to new packages
- When to add monitoring (only for API wrapper packages)

**Quick Reference**:

**Architecture**:
- `scripts/performance/measure.ts` - Runs all measurements
- `scripts/performance/detect-and-file.ts` - Detects regressions, creates GitHub issues
- `.github/workflows/weekly-performance.yml` - Runs every Monday at 1pm UTC

**Current Thresholds**:
| Package | Lag | Overhead | Memory |
|---------|-----|----------|--------|
| `@youdotcom-oss/mcp` | < 100ms | < 50% | < 400KB |
| `@youdotcom-oss/ai-sdk-plugin` | < 80ms | < 35% | < 350KB |

See [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) for detailed methodology and results

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

## Publishing

### Package Publishing Process

All packages in this monorepo are published to npm via GitHub Actions workflows.

**Standard Workflow** (most packages):
1. Updates version in `packages/{package}/package.json`
2. Scans all workspace packages for dependencies on the published package
3. Updates dependent packages with exact version (e.g., "1.4.0", no `^` or `~`)
4. Commits all version updates together
5. Creates GitHub release with tag `v{version}`
6. Publishes to npm using NPM Trusted Publishing (OIDC)
7. No manual npm tokens required

**Package-Specific Workflows**:
- Each package has its own workflow: `.github/workflows/publish-{package}.yml`
- Some packages may have additional deployment steps (see package-specific AGENTS.md)
- Example: MCP package triggers remote deployment and Anthropic MCP Registry update

**Version Format**:
- Git tags: `v{version}` (e.g., `v1.3.4`)
- package.json: `{version}` (no "v" prefix, e.g., `1.3.4`)
- npm: `{version}` (e.g., `@youdotcom-oss/mcp@1.3.4`)

**Triggering a Release**:
1. Go to: Actions → Publish {package} Release → Run workflow
2. Enter version WITHOUT "v" prefix: `1.3.4`
3. Optional: Enter `next` value for prereleases (e.g., `1` creates `1.3.4-next.1`)
4. The workflow automatically adds "v" for Git tags

**Cross-Package Dependencies**:
- Always use exact versions (no `^` or `~` prefixes)
- The publish workflow automatically updates dependent packages
- Example: Publishing `@youdotcom-oss/mcp@1.4.0` updates all packages that depend on it

**Authentication**:
- Uses [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers) (OIDC)
- No npm tokens required - GitHub Actions authenticates automatically
- Automatic provenance generation for supply chain security
- Only `PUBLISH_TOKEN` secret needed (for git operations on protected branches)

For package-specific publishing details (deployment steps, registry updates), see the package's AGENTS.md file.

## Support

- **Package Issues**: See package-specific AGENTS.md for troubleshooting, then create issue in [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Performance Issues**: See [docs/PERFORMANCE.md](./docs/PERFORMANCE.md)
- **API Keys**: [you.com/platform/api-keys](https://you.com/platform/api-keys)
- **Contributions**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
- **Email**: support@you.com
