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

### Phase 2: Metadata

**Question 3: Package Description**
```
One-line description for package.json? (max 200 characters)
```

**Validation for Question 3**:
- Max 200 characters
- Not empty

**Question 4: Keywords**
```
Keywords for npm? (comma-separated, e.g., 'ai, sdk, plugin')

Max 10 keywords.
```

**Validation for Question 4**:
- Split by comma, trim whitespace
- Max 10 keywords
- Each keyword lowercase recommended

**Question 5: Build Pattern**
```
Does this package need to be bundled or published as source?

Two patterns available:

1. Source-Published (recommended for most packages):
   - Publishes TypeScript source files directly
   - Users compile the code themselves
   - Example: @youdotcom-oss/mcp
   - Use when: MCP servers, CLI tools, packages without framework dependencies

2. Bundled (recommended for framework integrations):
   - Bundles code into a single JS file + type definitions
   - External dependencies excluded from bundle (ai, react, etc.)
   - Smaller install size, faster imports
   - Example: @youdotcom-oss/ai-sdk-plugin
   - Use when: SDK plugins, framework integrations, packages with peer dependencies

Answer "source" or "bundled"
```

**Validation for Question 5**:
- Must be either "source" or "bundled" (case-insensitive)
- Store as string for conditional file creation

**Question 6 (only if Question 5 = "bundled"): External Dependencies**
```
Which dependencies should be external (not bundled)?

External dependencies are loaded from the user's node_modules instead of being bundled.

Common externals:
- Framework packages: "ai", "react", "vue", "express"
- Large libraries that users likely already have
- Peer dependencies

Enter comma-separated list (e.g., "ai, zod") or leave empty to bundle everything.
```

**Validation for Question 6**:
- Only ask if build pattern is "bundled"
- Split by comma, trim whitespace
- Optional (can be empty)

### Phase 3: Optional Features

**Question 7: Centralized Performance Monitoring**
```
Should this package be added to centralized performance monitoring?

This monorepo uses centralized performance testing in scripts/performance/ to track
processing overhead across all packages with weekly automated monitoring.

Context:
- Centralized measurements run via scripts/performance/measure.ts
- Weekly automation detects regressions and creates GitHub issues
- Public transparency via GitHub issues and docs/PERFORMANCE.md
- No package-specific test maintenance required

Answer "Yes" if:
- Your package wraps You.com APIs (Search, Express, Contents)
- You need to track processing overhead compared to raw API calls
- Examples: MCP servers, SDK plugins, API client libraries

Answer "No" if:
- Your package doesn't directly wrap APIs
- Examples: Utility libraries, CLI tools, pure TypeScript helpers
```

**Validation for Question 7**:
- Must be either "Yes" or "No" (case-insensitive)
- Store as boolean for post-creation checklist reminder

## File Creation Sequence

After ALL questions answered and validated, create files in this order:

### 1. Create Directory Structure

```bash
# Create directory structure (mkdir -p is idempotent)
mkdir -p packages/{package-name}/src
mkdir -p packages/{package-name}/src/tests
mkdir -p packages/{package-name}/docs
```

**Note**: Using explicit paths for maximum compatibility across all shells. `mkdir -p` creates directories idempotently (no error if they already exist).

### 2. Configuration Files

**File: packages/{package-name}/tsconfig.json**
- Copy from: `packages/mcp/tsconfig.json`
- Pattern: Extends root tsconfig.json with package-specific overrides
- Always includes: `"include": ["src/**/*"]`
- For source-published: Also add `"outDir": "./dist"`, `"rootDir": "./src"`, `"exclude": ["src/**/*.spec.ts"]`
- For bundled (basic): Just include, no other overrides needed

**File: packages/{package-name}/biome.json**
- Copy from: `packages/mcp/biome.json`

**File: packages/{package-name}/package.json**
- Template based on build pattern (Question 5)
- Replace common fields:
  - name: `{npm-package-name}`
  - version: `0.1.0`
  - description: `{description}`
  - license: `MIT`
  - engines.node: `>=18`
  - engines.bun: `>= 1.2.21`
  - repository.type: `git`
  - repository.url: `git+https://github.com/youdotcom-oss/dx-toolkit.git`
  - repository.directory: `packages/{package-name}`
  - bugs.url: `https://github.com/youdotcom-oss/dx-toolkit/issues`
  - homepage: `https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}#readme`
  - author: `You.com (https://you.com)`
  - keywords: `{keywords-array}`
  - publishConfig.access: `public`

**If build pattern = "source":**
```json
{
  "name": "{npm-package-name}",
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
    "directory": "packages/{package-name}"
  },
  "bugs": {
    "url": "https://github.com/youdotcom-oss/dx-toolkit/issues"
  },
  "homepage": "https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}#readme",
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
    "check:write": "bun run format && bun run lint:fix && bun run format:package",
    "dev": "echo 'No dev server for library package'",
    "format": "biome format --write",
    "format:check": "biome format",
    "format:package": "format-package --write",
    "lint": "biome lint",
    "lint:fix": "biome lint --write",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  },
  "types": "./dist/main.d.ts"
}
```

**If build pattern = "bundled":**
```json
{
  "name": "{npm-package-name}",
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
    "directory": "packages/{package-name}"
  },
  "bugs": {
    "url": "https://github.com/youdotcom-oss/dx-toolkit/issues"
  },
  "homepage": "https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}#readme",
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
    "build:bundle": "bun build src/main.ts --outdir dist --target node {external-flags}",
    "build:types": "tsc --declaration --emitDeclarationOnly --noEmit false --outDir ./dist",
    "check": "bun run check:biome && bun run check:types && bun run check:package",
    "check:biome": "biome check",
    "check:package": "format-package --check",
    "check:types": "tsc --noEmit",
    "check:write": "bun run format && bun run lint:fix && bun run format:package",
    "dev": "echo 'No dev server for library package'",
    "format": "biome format --write",
    "format:check": "biome format",
    "format:package": "format-package --write",
    "lint": "biome lint",
    "lint:fix": "biome lint --write",
    "prepublishOnly": "bun run build",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  },
  "types": "./dist/main.d.ts"
}
```

Where `{external-flags}` is constructed from Question 6:
- If externals provided: `--external dep1 --external dep2 ...`
- If no externals: empty string
- Example with externals: `--external ai --external zod`

**For bundled packages, tsconfig.json stays minimal (already created from template):**
```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*"]
}
```

**Create tsconfig.build.json for bundled packages (optional but recommended):**

If you need different excludes for build vs type checking (e.g., exclude examples from declarations):

**File: packages/{package-name}/tsconfig.build.json**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["examples/**/*", "src/**/*.spec.ts"]
}
```

And update build:types script:
```json
"build:types": "tsc --project tsconfig.build.json --declaration --emitDeclarationOnly --noEmit false"
```

Otherwise, use inline flags:
```json
"build:types": "tsc --declaration --emitDeclarationOnly --noEmit false --outDir ./dist"
```

#### Understanding Monorepo Package Dependencies

**When to add @youdotcom-oss/{package} as a dependency:**

✅ **Use as dependency when:**
- You need to import schemas, types, or utilities from another package
- You're building on top of another package's functionality
- The package exports reusable code via `src/main.ts`
- Example: A CLI tool that validates API requests using `@youdotcom-oss/mcp` schemas

✅ **Example - Using MCP schemas (bundled pattern recommended):**
```json
{
  "scripts": {
    "build": "bun run build:bundle && bun run build:types",
    "build:bundle": "bun build src/main.ts --outdir dist --target node",
    "build:types": "tsc --project tsconfig.build.json --declaration --emitDeclarationOnly --noEmit false"
  },
  "dependencies": {
    "@youdotcom-oss/mcp": "1.3.8"
  }
}
```

With minimal tsconfig.json:
```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*"]
}
```

And tsconfig.build.json for declaration generation:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["examples/**/*", "src/**/*.spec.ts"]
}
```

```typescript
// Your package imports schemas from MCP package
import { SearchQuerySchema } from '@youdotcom-oss/mcp';

const query = SearchQuerySchema.parse({ query: 'test' });
```

**IMPORTANT**: Packages that depend on `@youdotcom-oss/mcp` MUST use the **bundled pattern** (Question 5 = "bundled") and bundle the MCP package into their distribution (do NOT use `--external`). This is because:
- `@youdotcom-oss/mcp` publishes TypeScript source files that require compilation
- Bundling the MCP package ensures all TypeScript is compiled and transitive dependencies (Zod, Hono, etc.) are included
- This produces a single distributable file that consumers can use without additional compilation

❌ **Do NOT use as dependency when:**
- You're building a client that connects to a server package via network
- The other package is a runtime service (HTTP server, MCP server, binary)
- You only need to communicate with the package, not import its code
- Example: A package that connects to MCP server via HTTP (no import needed)

**Current packages and their exports:**
- `@youdotcom-oss/mcp` - Exports API schemas, utilities, and formatting helpers
  - ✅ Import when: You need Search/Express/Contents schemas or API utilities
  - ✅ Build pattern: Use "bundled"
  - ❌ Don't import when: You're connecting as a client via HTTP/STDIO transport

**Decision flowchart:**
1. Does your package need to import code from another package? → YES: Add as dependency
2. Does your package import from `@youdotcom-oss/mcp`? → YES: Use bundled pattern (Q5 = "bundled")
3. Does your package connect to another package as a client? → NO: Don't add as dependency
4. Are you uncertain? → Check if the package exports utilities in `src/main.ts`

### 3. Source Files

**File: packages/{package-name}/src/main.ts**
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

#### Documentation Tone Guidelines

**IMPORTANT**: The root `README.md` (monorepo level) is an exception and does not follow these guidelines. These tone guidelines apply to **package-level documentation only**.

All packages maintain two distinct documentation files with different tones:
- **README.md**: Encouraging, user-facing, consumption-focused
- **AGENTS.md**: Directive, developer-facing, contribution-focused

See root [AGENTS.md → Documentation Standards](../../AGENTS.md#documentation-standards) for complete guidelines.

#### Package-Specific vs Universal Patterns

**Package-Specific Patterns** (include in package AGENTS.md):
- Framework integration patterns (e.g., Teams.ai Memory API, Anthropic SDK patterns)
- Domain-specific validation or transformation rules
- API client patterns unique to your integration
- Package-specific error handling or logging patterns
- Testing patterns that only apply to this package's architecture

**Universal Patterns** (already in root AGENTS.md, just reference them):
- Arrow functions, numeric separators, Bun APIs
- Error handling with typed catch (`err: unknown`)
- Test retry configuration (`{ timeout, retry: 2 }`)
- Test assertion anti-patterns (early returns, redundant conditionals)
- Import extensions (.ts, .js conventions)
- No unused exports

**When in doubt**: If the pattern applies to TypeScript/Bun development in general, it's universal. If it's specific to your package's domain or framework, it's package-specific.

#### Tone-Specific Writing Rules

**README.md (5 rules):**
1. Use encouraging, accessible language - avoid technical jargon
2. Second-person voice with active imperatives
3. **Maximum 4 steps in "Getting started"**
4. Natural language examples in quotes
5. Progressive disclosure for complex details

**AGENTS.md (5 rules):**
1. Directive language with absolute constraints ("Always", "Never", "Must")
2. Side-by-side code comparisons (✅/❌)
3. Sequential workflow structure
4. File path references with line numbers
5. Symptom/solution troubleshooting format

**API.md (5 rules):**
1. Technical and precise tone
2. Reference-style structure
3. Complete runnable examples
4. Full TypeScript signatures with arrow functions
5. Cross-references to related exports

---

**File: packages/{package-name}/README.md**
```markdown
# {description}

Get up and running with {package-name} in 4 quick steps. [Brief value proposition focusing on benefits]

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting started

### 1. Installation

Choose your package manager:

\`\`\`bash
# NPM
npm install {npm-package-name}

# Bun
bun add {npm-package-name}

# Yarn
yarn add {npm-package-name}
\`\`\`

### 2. Quick setup

\`\`\`typescript
import { placeholder } from '{npm-package-name}';

// Your first example - keep it simple and immediate value
\`\`\`

### 3. Configure (if needed)

[Add configuration steps if applicable, or skip if no configuration needed]

### 4. Test your setup

Try this simple example:
"[Natural language example showing what users can do]"

## Use cases & examples

### Common scenarios

**When to use [feature]:**
- "Example query in natural language"
- "Another example showing user intent"

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

## Troubleshooting

**Issue**: [Common problem users might face]

**Solution**:
- Step 1 to resolve
- Step 2 to verify

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## License

MIT - see [LICENSE](../../LICENSE) for details.
```

---

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

This package uses [Biome](https://biomejs.dev/) for automated code formatting and linting. Most style rules are enforced automatically via git hooks.

**For universal code patterns** (Arrow Functions, Numeric Separators, Bun APIs, Error Handling, Test Patterns, etc.), see the [root AGENTS.md](../../AGENTS.md#universal-code-patterns).

### Package-Specific Patterns

Add package-specific patterns here that are unique to this package's domain or framework integration. Examples:

- API client patterns specific to your integration
- Framework-specific conventions (e.g., Teams.ai Memory API usage)
- Domain-specific validation or transformation patterns
- Logging or error reporting patterns unique to this package

**Example pattern structure:**

\`\`\`ts
// ✅ Preferred - package-specific best practice
[your package-specific pattern]

// ❌ Avoid - problematic pattern for this package
[anti-pattern specific to this package]
\`\`\`

**What NOT to include here:**
- Universal TypeScript/Bun patterns (those belong in root AGENTS.md)
- General testing patterns (those belong in root AGENTS.md)
- Code style rules enforced by Biome (automatic)

## Testing

### Test Organization

- **Unit Tests**: \`src/*/tests/*.spec.ts\` - Test individual utilities
- **Integration Tests**: \`src/tests/*.spec.ts\` - Test package functionality end-to-end
- **Coverage Target**: >80% for core utilities
- **API Key Required**: [Only include if your package requires API keys for testing]

### Running Tests

\`\`\`bash
bun test                       # All tests
bun test:watch                 # Run tests in watch mode
bun test:coverage              # With coverage report
bun test src/tests/specific.spec.ts  # Specific file
\`\`\`

**For universal test patterns** (test() vs it(), retry configuration, error handling, assertion anti-patterns), see the [root AGENTS.md](../../AGENTS.md#universal-code-patterns).

### Package-Specific Testing Patterns

[Only add patterns here that are unique to this package's testing needs]

**Example - API Key-Dependent Tests:**
\`\`\`ts
const API_KEY = process.env.YOUR_API_KEY;
const describeWithApiKey = API_KEY ? describe : describe.skip;

describeWithApiKey('Integration Tests', () => {
  // Tests only run if API key is set
});
\`\`\`

## Contributing

See [root AGENTS.md](../../AGENTS.md#contributing) for contribution guidelines.

**Package-specific scope**: Use \`{package-name}\` scope in commit messages:

\`\`\`bash
feat({package-name}): add new feature
fix({package-name}): resolve issue
\`\`\`

## Publishing

See [root AGENTS.md](../../AGENTS.md#publishing) for the package publishing process.

**Package-specific**: Workflow name is "Publish {package-name} Release"

## Support

See [root AGENTS.md](../../AGENTS.md#support) for general support resources.

**Package-Specific Resources**:
- **API Documentation**: [docs/API.md](./docs/API.md)
- **Troubleshooting**: [README.md](./README.md#troubleshooting)

## Troubleshooting

### Common Issues

#### Symptom: [Specific problem developers might encounter]

**Solution**:

\`\`\`bash
# Fix command with explanation
command --option value
\`\`\`

[Add more troubleshooting sections as needed]
```

---

**File: packages/{package-name}/docs/API.md**
```markdown
# {description} - API Documentation

Complete API reference for {npm-package-name}.

## Installation

\`\`\`bash
npm install {npm-package-name}
\`\`\`

## Core Exports

### `functionName`

\`\`\`typescript
export const functionName = (params: ParamsType) => ReturnType
\`\`\`

**Description**: [What this function does]

**Parameters**:
- \`param1\` (Type): Description
- \`param2\` (Type): Description

**Returns**: Type - Description

**Example**:
\`\`\`typescript
import { functionName } from '{npm-package-name}';

const result = functionName({ param1: 'value' });
\`\`\`

[Add more API documentation as needed]
```

#### Quick Tone Check

Use these indicators to verify correct tone:

**README.md indicators:**
- ✅ "Get up and running in 4 steps"
- ✅ "No installation required"
- ✅ "Your agent will automatically..."
- ✅ "Just describe what you want"
- ❌ "Implementation requires..."
- ❌ "The system executes..."
- ❌ "Configure the following parameters..."

**AGENTS.md indicators:**
- ✅ "For universal patterns, see root AGENTS.md"
- ✅ "Package-specific pattern: [framework] Memory API"
- ✅ "MCP client connection patterns"
- ✅ "NEVER bypass git hooks"
- ✅ "Check pattern: \`^[a-z]+$\`"
- ❌ "Always use arrow functions" (that's universal, not package-specific)
- ❌ "Use numeric separators for large numbers" (universal)
- ❌ Extensive test code examples (keep it concise, reference root for universal patterns)
- ❌ "We recommend..." (too soft, use directive language)
- ❌ "Consider keeping hooks enabled" (too soft)

#### Common Creation Mistakes

1. **Tone bleed** - Don't mix README's encouraging tone with AGENTS' directive tone
2. **Placeholder retention** - Replace all \`{placeholders}\` with actual values
3. **Structure deviation** - Maintain exact template structure
4. **Jargon in README** - Keep technical details in AGENTS.md
5. **Missing validation** - Always apply checklist before completion
6. **Universal patterns in package AGENTS.md** - Don't duplicate universal patterns, reference root AGENTS.md instead
7. **Excessive test examples** - Keep testing section concise, focus on package-specific patterns only
8. **Missing references to root** - Always include "For universal patterns, see root AGENTS.md"

**Note**: Remember that the root \`README.md\` (monorepo level) is an exception and does not follow package README tone guidelines. Only package-level READMEs (e.g., \`packages/*/README.md\`) use the consumption-focused tone.

### 5. Create Publish Workflow

**File: .github/workflows/publish-{package-name}.yml**

**CRITICAL**:
- Workflow name MUST be "Publish {package-name} Release"
- Package directory is automatically derived from npm package name
- No separate OSS repository needed - everything is published from dx-toolkit

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
      version: ${{ github.event.inputs.version }}
      next: ${{ github.event.inputs.next }}
    secrets:
      PUBLISH_TOKEN: ${{ secrets.PUBLISH_TOKEN }}
```

**Why no separate repos?** All packages are published directly from the dx-toolkit monorepo to npm. This simplifies:
- Version management
- Release coordination
- Dependency updates
- Documentation consistency

**Authentication**: This monorepo uses [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers) (OIDC) for npm authentication:
- No npm tokens required - GitHub Actions authenticates automatically using OIDC
- Automatic provenance generation for supply chain security
- Only `PUBLISH_TOKEN` secret needed (for git operations on protected branches)

**Create the file**:

```bash
# Replace placeholders with actual values
PACKAGE_NAME="{package-name}"
NPM_PACKAGE="{npm-package-name}"

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
      version: \${{ github.event.inputs.version }}
      next: \${{ github.event.inputs.next }}
    secrets:
      PUBLISH_TOKEN: \${{ secrets.PUBLISH_TOKEN }}
EOF

# Verify the output
cat ".github/workflows/publish-${PACKAGE_NAME}.yml"
```

## Post-Creation Steps

### Automatic Actions

The command will automatically:

1. Delete existing lockfile: `rm bun.lock`
2. Run `bun install` from repository root to regenerate lockfile with new package
3. Verify workspace linkage: `bun run --filter {npm-package-name} check`
4. Display package structure summary

### Completion Message

After successful creation, display:

```markdown
## ✅ Package Created Successfully!

**Location**: packages/{package-name}/
**NPM Package**: {npm-package-name}
**Build Pattern**: {source|bundled}

---

## Next Steps

Your package has been created with the following structure:

\`\`\`
packages/{package-name}/
├── src/
│   ├── main.ts              # Public API exports
│   └── tests/               # Test directory
├── docs/
│   └── API.md               # API documentation
├── package.json
├── tsconfig.json
├── biome.json
├── README.md                # User-facing documentation
└── AGENTS.md                # Developer documentation
\`\`\`

**Workflow created**: `.github/workflows/publish-{package-name}.yml`

---

For development workflow, testing, publishing, and contribution guidelines, see:

- **Package development**: `packages/{package-name}/AGENTS.md`
- **Monorepo guidelines**: Root `AGENTS.md`
- **Adding performance monitoring**: Root `AGENTS.md` → "Adding Performance Monitoring to New Packages"
- **Publishing workflow**: Root `AGENTS.md` → "Publishing"

**Quick start:**

\`\`\`bash
cd packages/{package-name}
bun test                 # Run tests
bun run check            # Check code quality
bun run check:write      # Auto-fix issues
\`\`\`
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
- ✅ All configuration files copied/templated correctly (tsconfig.json, biome.json, package.json with all required fields)
- ✅ Source files created with appropriate templates (main.ts with exports)
- ✅ Documentation files created with proper content (README.md, AGENTS.md, API.md)
- ✅ Publish workflow created and syntactically valid
- ✅ `bun install` runs successfully from root
- ✅ Package passes `bun run check` from package directory
- ✅ Completion message displayed with references to AGENTS.md

For post-creation workflow (implementing features, testing, publishing), the user should refer to the package's AGENTS.md and root AGENTS.md as instructed in the completion message.

## Command Maintenance

This command is maintained in `.claude/commands/create-package.md`.

**Testing changes**: After modifying this command, test it end-to-end by creating a test package with various build patterns.

**Rollback behavior**: The command includes automatic rollback if any file creation fails. All created files are cleaned up on error.
