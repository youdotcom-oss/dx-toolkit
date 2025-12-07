# Create Package Command

> **Note**: This command works with any AI coding agent. While stored in `.claude/commands/` for Claude Code slash command support, any agent can read and follow these instructions to create a new package.

You are helping create a new package in this Bun monorepo.

## CRITICAL RULES

1. **Ask questions ONE AT A TIME** using AskUserQuestion - wait for each answer before proceeding
2. **Validate ALL inputs** before file creation
3. **Check for conflicts** (package exists, npm name taken)
4. **Create files in the correct order** with proper content
5. **Update workflow files programmatically** maintaining YAML formatting
6. **Provide post-creation checklist** with manual steps
7. **Implement rollback** on any failure

## Interactive Question Flow

Ask these questions sequentially (ONE AT A TIME):

### Phase 1: Basic Information

**Question 1: Package Name**
```
What is the package name? (lowercase-with-dashes, e.g., 'ai-sdk-plugin')

Requirements:
- Lowercase letters only
- Use hyphens (not underscores) for word separation
- Minimum 2 characters (prevents single-letter package names)
- Must match pattern: ^[a-z][a-z0-9-]*[a-z0-9]$
- **CRITICAL**: Must match the npm package name after @youdotcom-oss/
  - Example: @youdotcom-oss/ai-sdk → Package name: "ai-sdk"
  - This ensures directory path matches: packages/ai-sdk/
- Examples: 'ai-sdk', 'eval-harness', 'mcp'
```

**Validation for Question 1**:
- Check pattern: `^[a-z][a-z0-9-]*[a-z0-9]$` (requires 2+ characters, starts with letter, ends with letter/number)
- Check directory doesn't exist: `ls packages/{package-name}` should fail
- No uppercase, no underscores, no special characters

**Note**: All new packages are libraries. Only `mcp-server` is a server package.

**Question 2: NPM Package Name**
```
NPM package name?

Suggested: @youdotcom-oss/{package-name}
```

**Validation for Question 2**:
- Check pattern: `^@youdotcom-oss/[a-z]([a-z0-9-]*[a-z0-9])?$`
- **Verify consistency**: Extract name after slash, must equal package name from Question 1
- Verify not published: `npm view {name}` should return 404

**Question 3: OSS Repository Name**
```
OSS repository name?

Suggested: youdotcom-oss/{package-name}

Note: You will need to manually create this repository later.
```

**Validation for Question 3**:
- Check pattern: `^youdotcom-oss/[a-z]([a-z0-9-]*[a-z0-9])?$`

### Phase 2: Metadata

**Question 4: Package Description**
```
One-line description for package.json? (max 200 characters)
```

**Validation for Question 4**:
- Max 200 characters
- Not empty

**Question 5: Keywords**
```
Keywords for npm? (comma-separated, e.g., 'ai, sdk, plugin')

Max 10 keywords.
```

**Validation for Question 5**:
- Split by comma, trim whitespace
- Max 10 keywords
- Each keyword lowercase recommended

## File Creation Sequence

After ALL questions answered and validated, create files in this order:

### 1. Create Directory Structure

```bash
# Create directory structure (mkdir -p is idempotent)
mkdir -p packages/{package-name}/src
mkdir -p packages/{package-name}/tests
mkdir -p packages/{package-name}/docs
```

**Note**: Using explicit paths for maximum compatibility across all shells. `mkdir -p` creates directories idempotently (no error if they already exist).

### 2. Configuration Files

**File: packages/{package-name}/.gitignore**
- Copy from: `packages/mcp/.gitignore`

**Directory: packages/{package-name}/.hooks/**
- Copy from: `packages/mcp/.hooks/`
- Includes git hooks: `commit-msg` and `pre-commit`

**File: packages/{package-name}/tsconfig.json**
- Copy from: `packages/mcp/tsconfig.json`

**File: packages/{package-name}/biome.json**
- Copy from: `packages/mcp/biome.json`

**File: packages/{package-name}/package.json**
- Template based on `packages/mcp/package.json`
- Replace:
  - name: `{npm-package-name}`
  - version: `0.1.0`
  - description: `{description}`
  - repository.url: `git+https://github.com/youdotcom-oss/dx-toolkit.git`
  - repository.directory: `packages/{package-name}`
  - bugs.url: `https://github.com/youdotcom-oss/dx-toolkit/issues`
  - homepage: `https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}#readme`
  - keywords: `{keywords-array}`
- Keep minimal dependencies (typically just `zod` for validation)
- Remove server-specific fields: no `bin` field needed

**IMPORTANT**: All packages in this monorepo should point to the `dx-toolkit` repository, NOT to individual OSS repositories. The `directory` field indicates the package location within the monorepo.

### 3. Source Files

**File: packages/{package-name}/src/utils.ts**
```typescript
// Public API exports for {npm-package-name}
// Used when consuming this package as a library

// Export your main functionality here
// Example:
// export * from './schemas.ts';
// export * from './helpers.ts';

export const placeholder = 'Add your exports here';
```

### 4. Documentation Files

**File: packages/{package-name}/README.md**
```markdown
# {description}

[Brief overview of what the package does]

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting started

### Prerequisites

- Bun >= 1.2.21 (or Node.js >= 18)

### Installation

\`\`\`bash
# NPM
npm install {npm-package-name}

# Bun
bun add {npm-package-name}

# Yarn
yarn add {npm-package-name}
\`\`\`

### Quick example

\`\`\`typescript
import { placeholder } from '{npm-package-name}';

// Add usage example here
\`\`\`

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## License

MIT - see [LICENSE](./LICENSE) for details.
```

**File: packages/{package-name}/AGENTS.md**
```markdown
# {description} - Development Guide

Developer documentation for contributors and AI coding agents.

> **For end users**: See [README.md](./README.md) for usage instructions.

---

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **Validation**: Zod ^4.1.13
- **Testing**: Bun test (built-in)
- **Code Quality**: Biome 2.3.8 (linter + formatter)
- **Type Checking**: TypeScript 5.9.3

## Quick Start

### Setup Environment

\`\`\`bash
# From package directory
cd packages/{package-name}
bun install
\`\`\`

### Development Commands

\`\`\`bash
bun run dev              # Start in development mode
bun test                 # Run tests
bun run check            # All checks (biome + types + package)
bun run check:write      # Auto-fix all issues
\`\`\`

## Code Style

This package uses [Biome](https://biomejs.dev/) for automated formatting and linting.

[Add package-specific coding patterns here]

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Publishing

This package is published to npm via \`.github/workflows/publish-{package-name}.yml\`.

**Version Format**: Exact versions only (no ^ or ~ prefixes)

See monorepo root [AGENTS.md](../../AGENTS.md) for publishing details.
```

**File: packages/{package-name}/CONTRIBUTING.md**
```markdown
# Contributing to {description}

Thank you for your interest in contributing!

## Code of Conduct

This project adheres to professional open-source standards. Be respectful, constructive, and collaborative.

## Getting Started

### Prerequisites

- Bun >= 1.2.21

### Quick Setup

\`\`\`bash
git clone https://github.com/{oss-repo}.git
cd {package-name}
bun install
bun run dev
\`\`\`

For detailed development setup, see [AGENTS.md](./AGENTS.md).

## How to Contribute

### Reporting Bugs

**Before submitting**: Check [existing issues](https://github.com/{oss-repo}/issues)

**When reporting**, include:
- Clear bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Suggesting Features

Open an issue with:
- Clear use case description
- Why this benefits users
- Example usage (if applicable)

### Submitting Pull Requests

1. Fork the repository
2. Create feature branch: \`git checkout -b feature/my-feature\`
3. Make changes with tests
4. Run checks: \`bun run check\`
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
6. Push and create PR

## Development Workflow

See [AGENTS.md](./AGENTS.md) for:
- Code patterns
- Testing guidelines
- Architecture details

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/{oss-repo}/issues)
- **Email**: support@you.com
```

**File: packages/{package-name}/docs/API.md**
```markdown
# {description} - API Documentation

[Add API documentation here]

## Installation

\`\`\`bash
npm install {npm-package-name}
\`\`\`

## Usage

[Add usage examples]
```

### 5. Create Publish Workflow

**File: .github/workflows/publish-{package-name}.yml**

**CRITICAL**:
- Workflow name MUST be "Publish {package-name} Release"
- Package directory is automatically derived from npm package name
- No need to specify package_name parameter

Create minimal caller workflow:

```yaml
name: Publish {package-name} Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: "New version tag (e.g., 1.0.0)"
        required: true
      next:
        description: "Next prerelease number (optional)"
        required: false

jobs:
  publish:
    uses: ./.github/workflows/_publish-package.yml
    with:
      npm_package_name: "{npm-package-name}"
      oss_repo: "{oss-repo}"
      version: ${{ github.event.inputs.version }}
      next: ${{ github.event.inputs.next }}
    secrets:
      RELEASE_ADMIN_TOKEN: ${{ secrets.RELEASE_ADMIN_TOKEN }}
      YDC_OSS_PUBLISH_TOKEN: ${{ secrets.YDC_OSS_PUBLISH_TOKEN }}
      NPM_TOKEN: ${{ secrets.MCP_NPM_TOKEN }}
```

**Why no package_name?** The reusable workflow extracts it from `npm_package_name`:
- `@youdotcom-oss/ai-sdk` → Directory: `packages/ai-sdk`
- `@youdotcom-oss/eval` → Directory: `packages/eval`

**Create the file**:

```bash
# Replace placeholders with actual values
PACKAGE_NAME="{package-name}"
NPM_PACKAGE="{npm-package-name}"
OSS_REPO="{oss-repo}"

cat > ".github/workflows/publish-${PACKAGE_NAME}.yml" << EOF
name: Publish ${PACKAGE_NAME} Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: "New version tag (e.g., 1.0.0)"
        required: true
      next:
        description: "Next prerelease number (optional)"
        required: false

jobs:
  publish:
    uses: ./.github/workflows/_publish-package.yml
    with:
      npm_package_name: "${NPM_PACKAGE}"
      oss_repo: "${OSS_REPO}"
      version: \${{ github.event.inputs.version }}
      next: \${{ github.event.inputs.next }}
    secrets:
      RELEASE_ADMIN_TOKEN: \${{ secrets.RELEASE_ADMIN_TOKEN }}
      YDC_OSS_PUBLISH_TOKEN: \${{ secrets.YDC_OSS_PUBLISH_TOKEN }}
      NPM_TOKEN: \${{ secrets.MCP_NPM_TOKEN }}
EOF

# Verify the output
cat ".github/workflows/publish-${PACKAGE_NAME}.yml"
```

## Post-Creation Steps

### Automatic Actions

1. Delete existing lockfile: `rm bun.lock`
2. Run `bun install` from repository root to regenerate lockfile with new package
3. Verify workspace linkage: `bun run --filter {npm-package-name} check`
4. Display success summary with file count

### Manual Steps Checklist

Provide the user with this checklist:

```markdown
## ✅ Package Created Successfully!

**Location**: packages/{package-name}/
**NPM**: {npm-package-name}
**OSS Repo**: {oss-repo}

---

## Next Steps (Manual)

### 1. Create OSS Repository

Create the OSS repository:
1. Go to: https://github.com/organizations/youdotcom-oss/repositories/new
2. Repository name: `{package-name}`
3. Description: `{description}`
4. **Public repository**
5. **DO NOT** initialize with README (we'll sync from monorepo)
6. Click "Create repository"

### 2. Configure GitHub Secrets

**Important**: This monorepo uses a **shared token** for all OSS operations.

The existing `MCP_OSS_REMOTE_TOKEN` secret works for all packages. You do **NOT** need to create a new token.

**Verification**:
1. Check that `MCP_OSS_REMOTE_TOKEN` exists in: https://github.com/youdotcom-oss/dx-toolkit/settings/secrets/actions
2. Ensure the token has these permissions:
   - Read access to metadata
   - Read and Write access to code (for all `youdotcom-oss/*` repos)

**Only create a new token if**:
- The existing token doesn't have access to your new OSS repo
- Your organization requires per-package tokens (update workflows accordingly)

### 3. Test Publish Workflow

Test the publish workflow before going live:
1. Go to: https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml
2. Click "Run workflow"
3. Enter version: `0.1.0-test-1`
4. Optionally enter "next" number to create a pre-release
5. Verify all jobs succeed:
   - ✅ Create Release
   - ✅ Sync to OSS Repository
   - ✅ Publish to NPM (next tag)

### 4. Implement Package Logic

Now implement your package:
1. Edit `packages/{package-name}/src/main.ts` - Add your public API
2. Create feature modules in `src/`
3. Add tests in `tests/`
4. Update `docs/API.md` with API documentation
5. Run `bun run check` to verify code quality

### 5. Test Publish Workflow

Before going live, test the publish workflow with a prerelease:

1. Go to: https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml
2. Click "Run workflow"
3. Enter inputs:
   - **version**: `0.1.0` (base version without "v" prefix)
   - **next**: `1` (creates version `0.1.0-next.1`)
4. Verify all workflow steps succeed:
   - ✅ Input validation passes
   - ✅ Version updated in package.json
   - ✅ GitHub release created (private repo)
   - ✅ Synced to OSS repository via git subtree
   - ✅ GitHub release created (OSS repo)
   - ✅ Published to npm with `next` tag

5. Verify prerelease:
   - npm: `npm view {npm-package-name}@next`
   - Should show version `0.1.0-next.1`

### 6. First Stable Release

When ready for first public release:
1. Ensure OSS repository exists and is configured
2. Push package code to main branch
3. Trigger publish workflow with version `0.1.0`
4. Verify npm package: https://www.npmjs.com/package/{npm-package-name}
5. Verify GitHub release: https://github.com/{oss-repo}/releases
6. Test installation: `bun add {npm-package-name}`

---

## Package Structure Created

\`\`\`
packages/{package-name}/
├── .hooks/
│   ├── commit-msg
│   └── pre-commit
├── src/
│   └── utils.ts
├── tests/
├── docs/
│   └── API.md
├── package.json
├── tsconfig.json
├── biome.json
├── .gitignore
├── README.md
├── AGENTS.md
└── CONTRIBUTING.md
\`\`\`

## Workflow Files Created

- ✅ Created: `.github/workflows/publish-{package-name}.yml`
```

## Error Handling

### Pre-Creation Validation Errors

**If package name exists**:
```
❌ ERROR: Package '{package-name}' already exists at packages/{package-name}/
Cannot create duplicate package.

Suggestions:
- Choose a different name
- Check if you meant to update the existing package
```

**If npm package exists**:
```
❌ ERROR: NPM package '{npm-package-name}' already exists
View at: https://www.npmjs.com/package/{npm-package-name}

Suggestions:
- Choose a different npm package name
- Verify ownership if this is a You.com package
```

**If invalid naming**:
```
❌ ERROR: Package name '{input}' violates naming convention

Package names must:
- Use lowercase letters only
- Use hyphens (not underscores) for word separation
- Match pattern: ^[a-z]([a-z0-9-]*[a-z0-9])?$

Valid examples: 'ai-sdk-plugin', 'mcp-server', 'eval-harness'
Invalid examples: 'AI_SDK', 'aiSDK', 'ai_sdk'
```

### Mid-Creation Rollback

If ANY step fails during file creation:

1. **Track all created files** in a list as you go
2. **On failure**:
   - Delete the entire package directory: `rm -rf packages/{package-name}`
   - Restore workflow files: `git checkout .github/workflows/`
   - Delete lockfile and reinstall: `rm bun.lock && bun install`
   - Print error message with details
3. **Print recovery instructions**

Example rollback message:
```
❌ ERROR: Failed to create {file-name}
Error: {error-message}

Rolling back changes...
- Deleted: packages/{package-name}/
- Restored: .github/workflows/publish-{package-name}.yml
- Cleaned lockfile and reinstalled dependencies

Rollback complete. No changes were made.

Please fix the issue and try again.
```

### Workflow YAML Validation

After creating/updating workflow files, validate with:
```bash
gh workflow view "Publish {package-name} Release" --repo youdotcom-oss/dx-toolkit
```

If validation fails, rollback and report error.

## Implementation Guidelines

1. **Use AskUserQuestion** for each question - ONE AT A TIME
2. **Validate immediately** after each answer before proceeding
3. **Show clear error messages** with examples when validation fails
4. **Use Read tool** to get exact content from template files
5. **Use Write tool** to create new files (not Edit for new files)
6. **Use Edit tool** to update existing workflow files
7. **Preserve exact formatting** when copying config files
8. **Maintain YAML indentation** when updating workflows (2 spaces)
9. **Test with gh CLI** after workflow updates
10. **Print detailed summary** at the end with next steps
11. **Create integration test** - After successfully creating a package, recommend adding a test case to verify the command works end-to-end (CI test or manual checklist) to catch regressions

## Success Criteria

Before marking as complete, verify:

- ✅ All questions asked and validated
- ✅ Package directory created with correct structure
- ✅ All configuration files copied/templated correctly
- ✅ Source files created with appropriate templates
- ✅ Documentation files created with proper content
- ✅ Publish workflow created and syntactically valid
- ✅ `bun install` runs successfully
- ✅ Package passes `bun run check`
- ✅ Post-creation checklist displayed to user

Good luck creating the new package!

## Testing the Command

After implementing changes to this command:

1. **Manual Testing**: Run the command end-to-end with test inputs
   - Test with sample package name, description, keywords
   - Verify all files are created correctly
   - Check file contents match templates
   - Verify directory structure (src/, tests/, docs/)

2. **Integration Test**: Consider adding a test package creation in CI
   - Create test package with random name
   - Verify all files created correctly
   - Run `bun install` and `bun run check` on new package
   - Clean up test package
   - Verify no artifacts remain

3. **Rollback Test**: Verify rollback works by simulating failures
   - Test failure during file creation
   - Test failure during workflow updates
   - Ensure partial package creation is cleaned up
   - Verify git state is restored

Example CI test workflow:
```yaml
- name: Test create-package command
  run: |
    # Generate random package name
    TEST_PKG="test-pkg-$RANDOM"

    # Run command with test inputs
    # (implementation depends on how command is invoked)

    # Verify package was created
    test -d "packages/$TEST_PKG"
    test -f "packages/$TEST_PKG/package.json"

    # Verify package works
    cd "packages/$TEST_PKG"
    bun install
    bun run check

    # Clean up
    cd ../..
    rm -rf "packages/$TEST_PKG"
```
