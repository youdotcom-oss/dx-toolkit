---
name: create-package
description: Create new npm package with standardized structure, configs, and publish workflow
license: MIT
compatibility: Bun >= 1.2.21
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [monorepo, package, scaffold, workflow, npm, publishing]
---

# Create Package Workflow

Guided workflow for creating new packages in the dx-toolkit monorepo with standardized structure, configurations, and publish workflows.

> **For end users**: See [root README.md](../../README.md) for package installation and usage  
> **For universal patterns**: See [`.agents/rules/workflows.md`](../../.agents/rules/workflows.md) for post-creation workflow  
> **For code conventions**: See [`.agents/rules/core.md`](../../.agents/rules/core.md) and other rules in `.agents/rules/`

---

## When to Use This Skill

Use this skill when:
- Adding a new package to the dx-toolkit monorepo
- Creating MCP servers, AI SDK plugins, or Teams.ai integrations
- Scaffolding a new npm package with You.com patterns

**DO NOT use** for:
- One-off utility scripts (those don't need full package structure)
- Modifying existing packages (edit them directly)

---

## Critical Rules

1. **Ask questions ONE AT A TIME** - Wait for each answer before proceeding
2. **Validate ALL inputs** before file creation
3. **Check for conflicts** - Package exists, npm name taken
4. **Create files in correct order** with proper content
5. **Maintain exact field ordering** in package.json
6. **Implement rollback** on any failure
7. **Use exact version numbers** for workspace dependencies (no `^` or `~`)

---

## Interactive Question Flow

Ask these questions sequentially (ONE AT A TIME):

### Phase 1: Basic Information

**Question 1: Package Name**
```
What is the package name? (lowercase-with-dashes, e.g., 'ai-sdk-plugin')

Requirements:
- Lowercase letters only
- Use hyphens (not underscores)
- Minimum 2 characters
- Must match pattern: ^[a-z][a-z0-9-]*[a-z0-9]$
- CRITICAL: Must match npm package name after @youdotcom-oss/
  - Example: @youdotcom-oss/ai-sdk → Package name: "ai-sdk"
  - Ensures directory path matches: packages/ai-sdk/
```

**Validation**:
- Pattern: `^[a-z][a-z0-9-]*[a-z0-9]$`
- Check directory doesn't exist: `ls packages/{name}` should fail
- No uppercase, underscores, or special characters

**Question 2: NPM Package Name**
```
NPM package name?
Suggested: @youdotcom-oss/{package-name}
```

**Validation**:
- Pattern: `^@youdotcom-oss/[a-z]([a-z0-9-]*[a-z0-9])?$`
- **Verify consistency**: Name after slash MUST equal package name from Q1
- Verify not published: `npm view {name}` should return 404

**Question 3: Package Description**
```
One-line description for package.json? (max 200 characters)
```

**Validation**:
- Max 200 characters
- Not empty

**Question 4: Keywords**
```
Keywords for npm? (comma-separated, e.g., 'ai, sdk, plugin')
Max 10 keywords.
```

**Validation**:
- Split by comma, trim whitespace
- Max 10 keywords
- Lowercase recommended

### Phase 2: Package Type & Dependencies

**Question 5: Build Pattern**
```
Does this package need to be bundled or published as source?

Two patterns available:

1. Source-Published (recommended for most packages):
   - Publishes TypeScript source files directly
   - Users compile the code themselves
   - Example: @youdotcom-oss/mcp, @youdotcom-oss/api
   - Use when: MCP servers, API clients, packages without framework peer deps

2. Bundled (recommended for framework integrations):
   - Bundles code into single JS file + type definitions
   - External dependencies excluded from bundle (ai, react, etc.)
   - Smaller install size, faster imports
   - Example: @youdotcom-oss/ai-sdk-plugin, @youdotcom-oss/teams-anthropic
   - Use when: SDK plugins, framework integrations, packages with peer deps

Answer "source" or "bundled"
```

**Validation**:
- Must be "source" or "bundled" (case-insensitive)

**Question 6 (only if Q5 = "bundled"): External Dependencies**
```
Which dependencies should be external (not bundled)?

External dependencies are loaded from user's node_modules.

Common externals:
- Framework packages: "ai", "react", "@microsoft/teams.ai"
- Large libraries users likely already have
- Peer dependencies

Enter comma-separated list (e.g., "ai, zod") or leave empty.
```

**Validation**:
- Only ask if build pattern is "bundled"
- Split by comma, trim whitespace
- Optional (can be empty)

**Question 7 (only if Q5 = "bundled"): Peer Dependencies**
```
Which external dependencies should be listed as peer dependencies?

Peer dependencies are required by your package but provided by the user.

Example: If your package is an AI SDK plugin, "ai" should be a peer dependency.

Enter comma-separated list with versions (e.g., "ai@^6.0.0, zod@^4.0.0") or leave empty.
```

**Validation**:
- Only ask if build pattern is "bundled"
- Format: `package@version` or `@scope/package@version`
- Split by comma, trim whitespace
- Optional

---

## Package Templates

### Template A: Source-Published

**Used for**: MCP servers, API clients, CLI tools

**package.json structure** (exact field order):
```json
{
  "name": "@youdotcom-oss/{package}",
  "version": "0.1.0",
  "description": "{description}",
  "license": "MIT",
  "engines": {
    "node": ">=18",
    "bun": ">= 1.2.21"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/youdotcom-oss/dx-toolkit.git",
    "directory": "packages/{package}"
  },
  "bugs": {
    "url": "https://github.com/youdotcom-oss/dx-toolkit/issues"
  },
  "homepage": "https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package}#readme",
  "author": "You.com (https://you.com)",
  "keywords": {keywords-array},
  "type": "module",
  "main": "./src/main.ts",
  "exports": {
    ".": "./src/main.ts"
  },
  "files": [
    "./src/**",
    "!./src/**/tests/*",
    "!./src/**/*.spec.@(tsx|ts)"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "check": "bun run check:biome && bun run check:types && bun run check:package",
    "check:biome": "biome check",
    "check:package": "format-package --check",
    "check:types": "tsc --noEmit",
    "check:write": "biome check --write && bun run format:package",
    "format:package": "format-package --write",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  },
  "types": "./dist/main.d.ts"
}
```

**tsconfig.json**:
```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*"]
}
```

**biome.json**:
```json
{
  "extends": "../../biome.json"
}
```

### Template B: Bundled

**Used for**: SDK plugins, framework integrations

**package.json structure** (exact field order):
```json
{
  "name": "@youdotcom-oss/{package}",
  "version": "0.1.0",
  "description": "{description}",
  "license": "MIT",
  "engines": {
    "node": ">=18",
    "bun": ">= 1.2.21"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/youdotcom-oss/dx-toolkit.git",
    "directory": "packages/{package}"
  },
  "bugs": {
    "url": "https://github.com/youdotcom-oss/dx-toolkit/issues"
  },
  "homepage": "https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package}#readme",
  "author": "You.com (https://you.com)",
  "keywords": {keywords-array},
  "type": "module",
  "main": "./dist/main.js",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "default": "./dist/main.js"
    }
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "bun run build:bundle && bun run build:types",
    "build:bundle": "bun build src/main.ts --outdir dist --target node{external-flags}",
    "build:types": "tsc --declaration --emitDeclarationOnly --noEmit false --outDir ./dist",
    "check": "bun run check:biome && bun run check:types && bun run check:package",
    "check:biome": "biome check",
    "check:package": "format-package --check",
    "check:types": "tsc --noEmit",
    "check:write": "biome check --write && bun run format:package",
    "format:package": "format-package --write",
    "prepublishOnly": "bun run build",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  },
  "types": "./dist/main.d.ts",
  "peerDependencies": {
    // From Q7
  }
}
```

**Where `{external-flags}`**:
- If Q6 has externals: ` --external dep1 --external dep2 ...`
- If no externals: empty string
- Example: ` --external ai --external zod`

**tsconfig.json**:
```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*"]
}
```

**tsconfig.build.json** (optional but recommended):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.spec.ts"]
}
```

If creating tsconfig.build.json, update build:types script:
```json
"build:types": "tsc --project tsconfig.build.json --declaration --emitDeclarationOnly --noEmit false"
```

**biome.json**:
```json
{
  "extends": "../../biome.json"
}
```

---

## Dependency Rules

### Workspace Package Dependencies

**ALWAYS use exact versions** (no `^` or `~`):
```json
{
  "dependencies": {
    "@youdotcom-oss/api": "0.1.0"  // ✅ Exact version
  }
}
```

❌ **NEVER use**:
```json
{
  "dependencies": {
    "@youdotcom-oss/api": "^0.1.0",  // ❌ Caret range
    "@youdotcom-oss/api": "workspace:*"  // ❌ Workspace protocol
  }
}
```

**Why exact versions?** The publish workflow automatically updates dependent packages when publishing. Using ranges causes version conflicts.

### Source-Published Dependency Pattern

**ALL dependencies in `dependencies`** (consumers need types):
```json
{
  "dependencies": {
    "@youdotcom-oss/api": "0.1.0",
    "zod": "^4.3.5",
    "@modelcontextprotocol/sdk": "^1.25.2"
  }
}
```

### Bundled Dependency Pattern

**Split between `dependencies` and `peerDependencies`**:
```json
{
  "dependencies": {
    "@youdotcom-oss/api": "0.1.0"  // Internal workspace deps (bundled)
  },
  "peerDependencies": {
    "ai": "^6.0.0"  // Framework deps (external, user provides)
  },
  "devDependencies": {
    "ai": "^6.0.37"  // Need peer deps for development
  }
}
```

---

## File Creation Sequence

After ALL questions answered and validated:

### 1. Create Directory Structure

```bash
mkdir -p packages/{package}/src/tests
```

### 2. Create Configuration Files

Create in this order:
1. `packages/{package}/tsconfig.json` - Use template A or B
2. `packages/{package}/biome.json` - Extends root
3. `packages/{package}/package.json` - Use template A or B with all placeholders replaced

### 3. Create Source Files

**File**: `packages/{package}/src/main.ts`
```typescript
// Public API exports for {npm-package}

export const placeholder = 'Add your exports here';
```

### 4. Create Documentation Files

**File**: `packages/{package}/README.md`
```markdown
# {description}

[Brief value proposition]

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting started

### 1. Installation

\`\`\`bash
npm install {npm-package}
\`\`\`

### 2. Quick setup

\`\`\`typescript
import { placeholder } from '{npm-package}';
\`\`\`

### 3. Usage

[Add usage examples]

## License

MIT - see [LICENSE](../../LICENSE)
```

**File**: `packages/{package}/AGENTS.md`
```markdown
# {description} - Development Guide

> **For end users**: See [README.md](./README.md)  
> **For universal patterns**: See [root AGENTS.md](../../AGENTS.md)

## Tech Stack

- **Runtime**: Bun >= 1.2.21
- **Validation**: Zod (if applicable)
- **Testing**: Bun test
- **Code Quality**: Biome 2.3.8

## Quick Start

\`\`\`bash
cd packages/{package}
bun install
bun test
bun run check
\`\`\`

## Package-Specific Patterns

Add patterns unique to this package here.

**For universal patterns**, see [`.agents/rules/`](../../.agents/rules/).

## Testing

\`\`\`bash
bun test
bun test:coverage
\`\`\`

## Publishing

See [root AGENTS.md](../../AGENTS.md#publishing) for publishing process.

Workflow: `.github/workflows/publish-{package}.yml`
```

### 5. Create Publish Workflow

**File**: `.github/workflows/publish-{package}.yml`
```yaml
name: "Package: publish {npm-package}"

on:
  workflow_dispatch:
    inputs:
      version:
        description: "New version tag (e.g., 1.0.0)"
        required: true
      next:
        description: "Next prerelease number (optional)"
        required: false

permissions:
  contents: write
  id-token: write
  issues: write

jobs:
  publish:
    uses: ./.github/workflows/_publish-package.yml
    secrets:
      PUBLISH_TOKEN: ${{ secrets.PUBLISH_TOKEN }}
    with:
      npm_package_name: "{npm-package}"
      version: ${{ github.event.inputs.version }}
      next: ${{ github.event.inputs.next }}
```

---

## Post-Creation Actions

### Automatic Steps

After file creation:
1. Run `bun install` from repository root
2. Verify with: `bun run --filter {npm-package} check`
3. Display completion message

### Completion Message

```markdown
✅ Package Created Successfully!

**Location**: packages/{package}/
**NPM Package**: {npm-package}
**Build Pattern**: {source|bundled}

## Next Steps

**For complete post-creation workflow**, see `.agents/rules/workflows.md`

This covers:
- Implementing package logic with TSDoc
- Testing locally
- Publishing (prerelease and stable)

**Quick start:**

\`\`\`bash
cd packages/{package}
bun test
bun run check
\`\`\`
```

---

## Error Handling & Rollback

### Validation Errors

**Package exists**:
```
❌ ERROR: Package '{package}' already exists at packages/{package}/
Choose a different name.
```

**NPM package exists**:
```
❌ ERROR: NPM package '{npm-package}' already published
View at: https://www.npmjs.com/package/{npm-package}
```

**Invalid naming**:
```
❌ ERROR: Package name '{input}' violates naming convention

Must match: ^[a-z][a-z0-9-]*[a-z0-9]$
Valid: 'ai-sdk-plugin', 'mcp-server'
Invalid: 'AI_SDK', 'aiSDK', 'ai_sdk'
```

### Rollback on Failure

If ANY file creation fails:
1. Delete package directory: `rm -rf packages/{package}`
2. Delete workflow file: `rm .github/workflows/publish-{package}.yml`
3. Clean lockfile: `rm bun.lock && bun install`
4. Print error with details

```
❌ ERROR: Failed to create {file}
Error: {message}

Rolling back changes...
- Deleted: packages/{package}/
- Deleted: .github/workflows/publish-{package}.yml
- Cleaned lockfile

Rollback complete. No changes made.
```

---

## Success Criteria

Before completing, verify:
- ✅ All questions asked and validated
- ✅ Package directory created with correct structure
- ✅ Configuration files use exact field ordering
- ✅ package.json has all required fields
- ✅ Workflow created with correct name and inputs
- ✅ `bun install` runs successfully
- ✅ Package passes `bun run check`
- ✅ Completion message displayed

---

## Related Skills

- [`.agents/rules/workflows.md`](../../.agents/rules/workflows.md) - Post-creation workflow
- [`.agents/rules/core.md`](../../.agents/rules/core.md) - Code conventions
- [`.claude/skills/documentation`](../documentation/SKILL.md) - Documentation standards
- [`.agents/rules/testing.md`](../../.agents/rules/testing.md) - Test patterns
