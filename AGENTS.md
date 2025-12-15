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
├── marketplace.json       # Plugin marketplace manifest
├── packages/
│   └── mcp/               # MCP Server package (@youdotcom-oss/mcp)
│       ├── src/           # Source code
│       ├── bin/           # Compiled output
│       ├── docs/          # API documentation
│       ├── tests/         # Tests
│       ├── README.md      # User documentation
│       ├── AGENTS.md      # Package-specific dev guide
│       └── package.json   # Package config
├── plugins/               # Claude Code plugins (NOT published to npm)
│   └── teams-mcp-integration/
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

## Claude Code Plugin Marketplace

This repository serves as a **Claude Code Plugin Marketplace**, providing plugins for enterprise integrations, AI workflows, and deployment automation.

### Marketplace vs Packages

**Key Distinction**:
- **`packages/`** - npm packages (published to npm registry)
- **`plugins/`** - Claude Code plugins (distributed via GitHub/api.you.com, NOT published to npm)

### Plugin Architecture

```
plugins/{plugin-name}/
├── .claude-plugin/
│   └── plugin.json                     # Claude Code manifest
├── AGENTS.md                           # Universal AI agent instructions
├── commands/
│   └── {command}.md                    # Claude Code slash commands
├── src/
│   └── integration.ts                  # Core integration code (validated)
├── tests/
│   └── integration.spec.ts             # Bun tests (runs in CI)
├── templates/
│   └── *.ts                            # Code templates (shipped as-is)
├── reference/
│   └── *.md                            # Reference documentation
├── .mcp.json                           # Optional: MCP server config
├── package.json                        # private: true, Bun workspace
├── tsconfig.json                       # TypeScript config
├── README.md                           # Human-readable docs
└── LICENSE                             # MIT license
```

### Plugin AGENTS.md vs Package AGENTS.md

**Important Distinction**: Plugin AGENTS.md files serve a fundamentally different purpose than package AGENTS.md files.

**Package AGENTS.md** (e.g., `packages/mcp/AGENTS.md`):
- **Audience**: Developers contributing to the package
- **Purpose**: Development environment setup, codebase architecture
- **Tone**: Directive and technical ("Always use...", "NEVER bypass...")
- **Content**: Package-specific patterns, testing setup, build configuration
- **Distribution**: Included in npm package, primarily for internal use
- **Reference**: Links to root AGENTS.md for universal patterns

**Plugin AGENTS.md** (e.g., `plugins/teams-mcp-integration/AGENTS.md`):
- **Audience**: Universal AI agents (Claude, Cursor, Windsurf, etc.) that don't support Claude Code plugins
- **Purpose**: Lightweight file that aliases commands for cross-agent compatibility
- **Pattern**: References command files to avoid duplication
- **Content**: When to trigger, command file path to fetch
- **Distribution**: Publicly hosted at `https://api.you.com/plugins/{plugin-name}/AGENTS.md`
- **Example**: `Fetch and follow: plugins/teams-mcp-integration/commands/generate-teams-app.md`

**Why this pattern**:
- ✅ Single source of truth - Detailed instructions in commands/
- ✅ Never out of sync - AGENTS.md just points to command file
- ✅ Cross-agent compatibility - Works with Cursor, Windsurf, Cody, etc.
- ✅ Simple maintenance - Update command once, AGENTS.md unchanged

### Plugin Workspace Integration

Plugins are part of the Bun workspace for local validation:

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
- ✅ Plugin still distributed via GitHub (not npm)
- ✅ Templates shipped as-is (not individually validated)

### Plugin Naming Convention

Plugin directories must follow this naming rule:

**Rule**: Plugin directory name MUST match the plugin name in `.claude-plugin/plugin.json`

**Examples**:
- Plugin name: `teams-mcp-integration` → Directory: `plugins/teams-mcp-integration` ✅
- Plugin name: `google-chat-mcp-integration` → Directory: `plugins/google-chat-mcp-integration` ✅

**Validation**: Marketplace tests validate plugin names match directory names.

**Current plugins**:
- `teams-mcp-integration` in `plugins/teams-mcp-integration/`

### Plugin Commands

```bash
# From root - test specific plugin
bun --cwd plugins/teams-mcp-integration test

# From root - check specific plugin
bun --cwd plugins/teams-mcp-integration run check

# From root - test all plugins
bun run --filter 'plugins/*' test

# From plugin directory
cd plugins/teams-mcp-integration
bun test
bun run check
```

### Distribution Strategy

**Primary Distribution**: Plugins are distributed via GitHub Releases

**Release Format**:
- Tag: `{plugin-name}@v{version}` (e.g., `teams-mcp-integration@v1.0.0`)
- Archive: `{plugin-name}-v{version}.tar.gz`
- Pattern: Consistent with package releases (uses `@` separator)

**Installation URLs**:
- Latest: `https://github.com/youdotcom-oss/dx-toolkit/releases/latest/download/{plugin-name}-v{version}.tar.gz`
- Specific: `https://github.com/youdotcom-oss/dx-toolkit/releases/download/{plugin-name}@v{version}/{plugin-name}-v{version}.tar.gz`
- Installer: `curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name}`

**Marketplace Versioning**:
- Format: Date-based CalVer (`YYYY.MM.DD`)
- Auto-bumped: On every plugin release
- Indicates: Last marketplace update date
- Example: `"version": "2024.12.14"` in marketplace.json

**Release Flow**:
1. Develop in `dx-toolkit/plugins/{plugin-name}/`
2. Test locally with Bun workspace
3. CI validates and tests on PR
4. Trigger `publish-{plugin-name}` workflow with version
5. Workflow creates GitHub Release with archive
6. Workflow updates marketplace.json (plugin version + marketplace date)
7. Users install via GitHub Release URLs

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

**Bun Test Patterns**: Always use `test()` in Bun tests, never `it()`

```ts
// ✅ Preferred - Bun test API
import { test, expect } from 'bun:test';

test('should validate input', () => {
  expect(true).toBe(true);
});

test('async operation', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// ❌ Avoid - Jest/Vitest syntax
import { it, expect } from 'bun:test';

it('should validate input', () => {  // Don't use it()
  expect(true).toBe(true);
});
```

**Why use test() not it()?**
- `test()` is Bun's native test API
- Consistent with Bun documentation and examples
- Clearer intent (explicitly testing)
- `it()` is compatibility alias from Jest/Vitest

**Error Handling**: Always use try/catch with typed error handling

```ts
// ✅ Preferred - typed error handling
try {
  const response = await apiCall();
  return formatResponse(response);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error(`API call failed: ${errorMessage}`);
  throw new Error(`Failed to process request: ${errorMessage}`);
}

// ❌ Avoid - untyped catch
try {
  const response = await apiCall();
  return formatResponse(response);
} catch (err) {  // Implicit 'any' type
  console.error(err.message);  // Unsafe property access
}

// ❌ Avoid - catch without type checking
catch (err: any) {
  console.error(err.message);  // 'any' defeats type safety
}
```

**Why typed error handling?**
- TypeScript requires explicit typing for catch clauses
- Prevents unsafe property access on unknown error types
- Forces proper type narrowing (instanceof Error check)
- Better error messages and debugging

**Test Retry Configuration**: Use retry for API-dependent tests

```ts
// ✅ Preferred - API tests with retry
test('should fetch data from API', async () => {
  const response = await apiCall();
  expect(response).toBeDefined();
}, { timeout: 60_000, retry: 2 });

// ❌ Avoid - no retry for flaky API tests
test('should fetch data from API', async () => {
  const response = await apiCall();
  expect(response).toBeDefined();
}, { timeout: 60_000 });  // May fail on transient network issues
```

**Why use retry?**
- Handles transient network issues, rate limiting, intermittent failures
- Tests pass if any of 3 attempts succeed (1 initial + 2 retries)
- Low cost: only runs extra attempts on failure
- Standard pattern: `{ timeout: X, retry: 2 }`

**Considerations**:
- Total test time = iterations × max_attempts × time_per_iteration
- Use for API integration tests, not for unit tests
- Example: 5 iterations × 3 attempts × 7s/call = 105s max

**Test Assertion Anti-Patterns**: Avoid patterns that silently skip assertions

```ts
// ❌ Avoid - early returns silently exit test
test('should validate item', () => {
  const item = getItem();
  if (!item) return;  // Test passes even if item is undefined!
  expect(item.name).toBe('test');
});

// ❌ Avoid - redundant conditionals
test('should have markdown property', () => {
  expect(item?.markdown).toBeDefined();
  if (item?.markdown) {  // Redundant check
    expect(typeof item.markdown).toBe('string');
  }
});

// ✅ Preferred - let tests fail naturally
test('should validate item', () => {
  const item = getItem();
  expect(item).toBeDefined();
  expect(item).toHaveProperty('name');
  expect(item?.name).toBe('test');
});

test('should have markdown property', () => {
  expect(item).toBeDefined();
  expect(item).toHaveProperty('markdown');  // Fails clearly if undefined
  expect(typeof item?.markdown).toBe('string');
});
```

**Why avoid these patterns?**
- Early returns make tests pass when they should fail
- Redundant conditionals create false confidence
- Tests should fail with clear error messages
- Use optional chaining with direct assertions

**Private Class Fields**: Always use `#` private fields, never `private` keyword

```ts
// ✅ Preferred - JavaScript private fields (#)
export class AnthropicChatModel implements IChatModel {
  #anthropic: Anthropic;
  #model: string;
  #requestOptions?: AnthropicRequestOptions;
  #log: ILogger;

  constructor(options: AnthropicChatModelOptions) {
    this.#model = options.model;
    this.#requestOptions = options.requestOptions;
    this.#log = options.logger || new ConsoleLogger();
    this.#anthropic = new Anthropic({ apiKey: options.apiKey });
  }

  async send(input: Message): Promise<ModelMessage> {
    const response = await this.#anthropic.messages.create({
      model: this.#model,
      // ...
    });
  }
}

// ❌ Avoid - TypeScript private keyword
export class AnthropicChatModel implements IChatModel {
  private anthropic: Anthropic;
  private model: string;
  private requestOptions?: AnthropicRequestOptions;
  private log: ILogger;

  constructor(options: AnthropicChatModelOptions) {
    this.model = options.model;
    this.requestOptions = options.requestOptions;
    this.log = options.logger || new ConsoleLogger();
    this.anthropic = new Anthropic({ apiKey: options.apiKey });
  }
}
```

**Why use # private fields?**
- True runtime privacy (not just compile-time)
- JavaScript standard (TC39 Stage 4)
- Prevents accidental access in JavaScript
- More explicit intent than `private` keyword
- Works in both TypeScript and JavaScript
- Better encapsulation for class internals

**Type Guards**: Prefer type guards over type casting for runtime type narrowing

```ts
// ✅ Preferred - Type guard functions
const isInputModelMessage = (input: Message): input is ModelMessage =>
  input.role === 'model' && Boolean(input?.function_calls);

const isHandler = (fn: unknown): fn is {
  (): unknown;
  handler: (args: unknown) => Promise<unknown>;
} => Boolean(fn && Object.hasOwn(fn, 'handler'));

// Usage - type-safe without casting
if (isInputModelMessage(input)) {
  // TypeScript knows input is ModelMessage here
  for (const call of input.function_calls) {
    const func = options.functions[call.name];
    if (isHandler(func)) {
      // TypeScript knows func has handler property here
      const result = await func.handler(call.arguments);
    }
  }
}

// ❌ Avoid - Type casting (loses type safety)
if ((input as ModelMessage).function_calls) {
  for (const call of (input as ModelMessage).function_calls) {
    const func = options.functions[call.name] as { handler: Function };
    const result = await func.handler(call.arguments);
  }
}
```

**Why prefer type guards over casting?**
- Native TypeScript type narrowing
- Explicit runtime checks with compile-time benefits
- Clear, reusable type predicates
- Type safety at call sites without assumptions
- Self-documenting type requirements

**When to use Zod for schema validation:**
Type guards are for internal type narrowing. Use Zod for schema validation:
- MCP tool input/output schemas (see `packages/mcp/src/*/schemas.ts`)
- API request/response validation
- Validating external input (user input, config files)
- Need detailed error messages for validation failures
- Sharing schemas between runtime and compile-time validation

**Resources:**
- [Bun Runtime Utils](https://bun.sh/docs/runtime/utils)
- [Bun Shell](https://bun.sh/docs/runtime/shell)
- [Bun Test](https://bun.sh/docs/cli/test)

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

After creating a package with the create-package command:

**1. Implement Package Logic**
- Edit `packages/{package-name}/src/main.ts` to export your public API
- Create feature modules in `src/` directory
- Add tests in `src/tests/` directory
- Update `docs/API.md` with API documentation
- Run `bun run check` from package directory to verify code quality

**2. Register Package Documentation**
- Add your package's AGENTS.md reference to root `CLAUDE.md`
- This ensures Claude Code can access package development guidelines
- Format: `@packages/{package-name}/AGENTS.md`

**3. Add Performance Monitoring (Optional)**
- Only required for packages that wrap You.com APIs directly
- Add measurements to `scripts/performance/measure.ts`
- See "Adding Performance Monitoring to New Packages" section below
- Skip for utility libraries, CLI tools, or packages without API wrappers

**4. Test Locally**
```bash
cd packages/{package-name}
bun test                 # Run tests
bun run check            # Check code quality
bun run build            # Build package (if bundled pattern)
```

**5. Test Publish Workflow**
- Test with prerelease before first stable release
- Go to: `https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml`
- Enter version `0.1.0` with next `1` to create `0.1.0-next.1`
- Verify workflow succeeds and package appears on npm

**6. First Stable Release**
- Push package code to main branch
- Trigger publish workflow with version `0.1.0` (no next value)
- Verify package at `https://www.npmjs.com/package/{npm-package-name}`
- Test installation: `bun add {npm-package-name}`

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

## Performance Testing & Monitoring

### Centralized Performance Monitoring

This monorepo uses a centralized weekly monitoring system to track performance across all packages:

**Architecture**:
- **Measurements**: `scripts/performance/measure.ts` - Runs all package measurements
- **Detection**: `scripts/performance/detect-and-file.ts` - Detects regressions and creates GitHub issues
- **Documentation**: `scripts/performance/update-docs.ts` - Updates docs/PERFORMANCE.md automatically
- **Automation**: `.github/workflows/weekly-performance.yml` - Runs every Monday at 1pm UTC

**Key Benefits**:
- Centralized tracking across all packages
- Automated GitHub issue creation for regressions
- Public transparency (GitHub issues visible to all)
- Historical tracking (90-day artifact retention)
- No redundant test maintenance

### Running Performance Measurements

**Locally**:
```bash
# Set API key
export YDC_API_KEY=your-key-here

# Run measurements
bun scripts/performance/measure.ts > results.json

# View results
cat results.json

# Check for regressions (requires gh CLI)
bun scripts/performance/detect-and-file.ts results.json

# Update docs
bun scripts/performance/update-docs.ts results.json
```

**In CI**: Automatically runs every Monday via weekly-performance workflow

### Package Thresholds

| Package | Lag | Overhead | Memory |
|---------|-----|----------|--------|
| `@youdotcom-oss/mcp` | < 100ms | < 50% | < 400KB |
| `@youdotcom-oss/ai-sdk-plugin` | < 80ms | < 35% | < 350KB |

See [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) for detailed methodology and results.

### When Regressions Occur

**Automatic**:
1. Weekly workflow detects threshold violations
2. GitHub issue created automatically with:
   - Severity classification (minor/moderate/critical)
   - Current vs threshold comparison
   - Investigation steps
   - Links to workflow run and documentation
3. Issue updated if regression persists in subsequent runs

**Manual Investigation**:
```bash
# Run measurement locally
bun scripts/performance/measure.ts > results.json

# Check specific package results
cat results.json | grep -A 20 "@youdotcom-oss/mcp"

# Profile with CPU profiler
bun --cpu-prof scripts/performance/measure.ts
```

### Adding Performance Monitoring to New Packages

When creating new packages, add measurements in `scripts/performance/measure.ts`:

```typescript
const measureNewPackage = async (): Promise<PerformanceResult> => {
  const results = await measurePerformance({
    iterations: 20,
    warmup: async () => { /* ... */ },
    raw: async () => { /* Raw API call */ },
    wrapper: async () => { /* Your abstraction layer */ },
  });

  return {
    package: '@youdotcom-oss/new-package',
    timestamp: new Date().toISOString(),
    metrics: {
      processingLag: {
        value: results.processingLag,
        threshold: 80, // Set appropriate threshold
        pass: results.processingLag < 80,
      },
      // ... other metrics
    },
    rawData: { /* ... */ },
  };
};

// Add to main() Promise.all()
const results = await Promise.all([
  measureMcp(),
  measureAiSdkPlugin(),
  measureNewPackage(), // Add here
]);
```

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
