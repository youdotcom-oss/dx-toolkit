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

**Question 7: Processing Lag Tests**
```
Does this package need processing lag tests?

These tests measure the processing overhead introduced by your code compared to raw API calls.

Context:
- We can't improve the You.com API performance itself
- But we need to quantify what lag our abstraction layer adds
- Tests compare: raw fetch/curl vs your package methods
- Useful for: MCP tools, SDK wrappers, API client libraries

Answer "Yes" if your package wraps You.com APIs and you need to track overhead.
Answer "No" if your package doesn't directly wrap APIs (e.g., utility libraries, CLI tools).
```

**Validation for Question 7**:
- Must be either "Yes" or "No" (case-insensitive)
- Store as boolean for conditional file creation

**Question 8: User-Agent Prefix (only if Question 7 = "Yes")**
```
What is the User-Agent prefix for this package?

This will be used in API requests with the format: {prefix}/{version} (You.com; {client})

Examples:
- "MCP" for MCP server packages
- "AI-SDK" for AI SDK plugins
- "EVAL" for evaluation harnesses
- "CLI" for CLI tools

The prefix should be short (2-10 characters) and uppercase.
```

**Validation for Question 8**:
- Only ask if processing lag tests enabled
- Pattern: `^[A-Z][A-Z0-9-]{1,9}$` (2-10 uppercase chars, can include hyphens)
- Examples: "MCP", "AI-SDK", "EVAL", "CLI"

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
  - repository.url: `git+https://github.com/youdotcom-oss/dx-toolkit.git`
  - repository.directory: `packages/{package-name}`
  - bugs.url: `https://github.com/youdotcom-oss/dx-toolkit/issues`
  - homepage: `https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}#readme`
  - keywords: `{keywords-array}`

**If build pattern = "source":**
```json
{
  "main": "./src/main.ts",
  "exports": {
    ".": "./src/main.ts"
  },
  "files": [
    "./src/**",
    "!./src/**/tests/*",
    "!./src/**/*.spec.@(tsx|ts)"
  ],
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
  }
}
```

**If build pattern = "bundled":**
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
  }
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

This package uses [Biome](https://biomejs.dev/) for automated formatting and linting.

### Package-Specific Patterns

**Arrow Functions**: Always use arrow functions for declarations

\`\`\`ts
// ✅ Preferred
export const fetchData = async (params: Params) => { ... };

// ❌ Avoid
export async function fetchData(params: Params) { ... }
\`\`\`

**[Add more package-specific coding patterns here]**

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Publishing

This package is published to npm via \`.github/workflows/publish-{package-name}.yml\`.

**Version Format**: Exact versions only (no ^ or ~ prefixes)

See monorepo root [AGENTS.md](../../AGENTS.md) for publishing details.

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
- ✅ "Always use arrow functions"
- ✅ "NEVER bypass git hooks"
- ✅ "All exports must be used"
- ✅ "Check pattern: \`^[a-z]+$\`"
- ❌ "We recommend arrow functions"
- ❌ "Consider keeping hooks enabled"
- ❌ "Try to avoid unused exports"

#### Common Creation Mistakes

1. **Tone bleed** - Don't mix README's encouraging tone with AGENTS' directive tone
2. **Placeholder retention** - Replace all \`{placeholders}\` with actual values
3. **Structure deviation** - Maintain exact template structure
4. **Jargon in README** - Keep technical details in AGENTS.md
5. **Missing validation** - Always apply checklist before completion

**Note**: Remember that the root \`README.md\` (monorepo level) is an exception and does not follow package README tone guidelines. Only package-level READMEs (e.g., \`packages/*/README.md\`) use the consumption-focused tone.

### 5. Processing Lag Tests (Optional)

**ONLY create these files if user answered "Yes" to Question 7.**

**Important Note**: Performance thresholds are documented centrally in `docs/PERFORMANCE.md`. After creating the test file, add a new section to `docs/PERFORMANCE.md` under "Package Performance Thresholds" with your package's thresholds and test location.

**File: packages/{package-name}/tests/processing-lag.spec.ts**

This template follows production patterns from `@youdotcom-oss/mcp` and `@youdotcom-oss/ai-sdk-plugin`. Key improvements:
- **Outlier detection**: `calculateStats()` helper filters network anomalies
- **Test retry**: `{ timeout: 90_000, retry: 2 }` handles API variability
- **API imports**: Import constants from `@youdotcom-oss/mcp` if using it
- **Better metrics**: Per-operation growth tracking, growth pattern analysis

```typescript
import { heapStats } from 'bun:jsc';
import { beforeAll, describe, expect, test } from 'bun:test';
import packageJson from '../../package.json' with { type: 'json' };

// If your package depends on @youdotcom-oss/mcp, import API constants from it:
// import { SEARCH_API_URL, EXPRESS_API_URL, CONTENTS_API_URL } from '@youdotcom-oss/mcp';

// Otherwise, define API constants for the APIs you're wrapping:
const SEARCH_API_URL = 'https://api.ydc-index.io/search';
const EXPRESS_API_URL = 'https://api.you.com/smart-agent/express';
const CONTENTS_API_URL = 'https://api.ydc-index.io/rag';

const YDC_API_KEY = process.env.YDC_API_KEY ?? '';
const USER_AGENT = `{USER_AGENT_PREFIX}/${packageJson.version} (You.com; processing-lag-test)`;

/**
 * Calculate statistics and remove outliers (> 2 standard deviations)
 * Improves test reliability by filtering network anomalies
 */
const calculateStats = (times: number[]) => {
  const avg = times.reduce((a, b) => a + b) / times.length;
  const stdDev = Math.sqrt(times.reduce((sum, time) => sum + (time - avg) ** 2, 0) / times.length);

  // Remove outliers (> 2 standard deviations from mean)
  const filtered = times.filter((t) => Math.abs(t - avg) <= 2 * stdDev);

  return {
    avg: filtered.length > 0 ? filtered.reduce((a, b) => a + b) / filtered.length : avg,
    outliers: times.length - filtered.length,
  };
};

beforeAll(async () => {
  console.log('\n=== Warming up ===');
  console.log('Running warmup calls to eliminate cold start effects...');

  // TODO: Add warmup code for your package
  // Example for SDK plugin:
  // const searchTool = youSearch({ apiKey: YDC_API_KEY });
  // await searchTool.execute?.({ query: 'warmup', count: 1 }, { toolCallId: 'warmup', messages: [] });

  console.log('Warmup complete. Starting measurements...\n');
});

describe('Processing Lag: Package vs Raw API Calls', () => {
  const iterations = 10;

  test.serial(
    'Search API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const packageTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
        const rawUrl = new URL(SEARCH_API_URL);
        rawUrl.searchParams.append('query', 'javascript tutorial');
        rawUrl.searchParams.append('count', '3');

        await fetch(rawUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': YDC_API_KEY,
            'User-Agent': USER_AGENT,
          },
        });
        rawTimes.push(performance.now() - rawStart);

        // Your package method (with abstraction overhead)
        const packageStart = performance.now();
        // TODO: Replace with your actual package method call
        // Example for SDK plugin:
        // await searchTool.execute?.({ query: 'javascript tutorial', count: 3 }, { toolCallId: 'test', messages: [] });
        packageTimes.push(performance.now() - packageStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const packageStats = calculateStats(packageTimes);
      const processingLag = packageStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Search API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`Package avg: ${packageStats.avg.toFixed(2)}ms (${packageStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (adjust based on package type - see table below)
      expect(processingLag).toBeLessThan(50); // < 50ms absolute lag (thin library default)
      expect(overheadPercent).toBeLessThan(10); // < 10% relative overhead (thin library default)
    },
    { timeout: 90_000, retry: 2 }, // Retry up to 2 times for network/API variability
  );

  test.serial(
    'Memory overhead from package abstraction',
    async () => {
      // Force GC before measurement
      Bun.gc(true);
      await Bun.sleep(100); // Let GC complete

      const beforeHeap = heapStats();

      // Run multiple operations to measure sustained memory overhead
      const memoryIterations = 5;
      for (let i = 0; i < memoryIterations; i++) {
        // TODO: Replace with your package method
        // Example for SDK plugin:
        // await searchTool.execute?.({ query: 'memory test', count: 1 }, { toolCallId: 'test', messages: [] });
      }

      // Force GC after measurement
      Bun.gc(true);
      await Bun.sleep(100); // Let GC complete

      const afterHeap = heapStats();

      const heapGrowth = afterHeap.heapSize - beforeHeap.heapSize;
      const perOpGrowth = heapGrowth / memoryIterations;

      console.log('\n=== Memory Overhead ===');
      console.log(`Heap before: ${(beforeHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Heap after: ${(afterHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Total growth: ${(heapGrowth / 1024).toFixed(2)} KB`);
      console.log(`Per-operation growth: ${(perOpGrowth / 1024).toFixed(2)} KB`);
      console.log(`Growth pattern: ${heapGrowth < 0 ? 'Constant (good)' : heapGrowth > 100_000 ? 'Linear (check for leaks)' : 'Stable'}`);

      // Assert memory overhead threshold (adjust based on package type - see table below)
      expect(heapGrowth).toBeLessThan(1024 * 300); // < 300KB (thin library default)
    },
    { timeout: 15_000, retry: 2 },
  );
});

describe('Processing Lag Summary', () => {
  test('displays threshold information', () => {
    console.log('\n=== Processing Lag Thresholds ===');
    console.log('Absolute lag: < 50ms'); // Update based on package type
    console.log('Relative overhead: < 10%'); // Update based on package type
    console.log('Memory overhead: < 300KB'); // Update based on package type
    console.log('\nNote: These tests measure the overhead introduced by our');
    console.log('abstraction layer compared to raw API calls. We cannot improve');
    console.log('the You.com API performance itself, but we monitor what lag');
    console.log('our code adds to ensure it remains minimal.');
    expect(true).toBe(true);
  });
});
```

**Customization Checklist:**

1. **Replace `{USER_AGENT_PREFIX}`** with your user agent prefix from Question 8
   - Examples: "MCP", "AI-SDK", "EVAL", "CLI"
   - Line ~703 in USER_AGENT constant

2. **Import API constants** (if using `@youdotcom-oss/mcp`):
   - Uncomment line ~695: `import { SEARCH_API_URL, ... } from '@youdotcom-oss/mcp';`
   - Remove or comment out lines ~698-700 (manual API constant definitions)
   - If NOT using MCP package: Keep manual definitions and update URLs

3. **Import your package methods**:
   - Add imports after line ~692
   - Example for SDK: `import { youSearch, youExpress, youContents } from '../main.ts';`
   - Example for MCP: Import client setup utilities

4. **Replace all TODOs** (3 locations):
   - Line ~726: Add warmup code
   - Line ~761: Add package method call in test loop
   - Line ~801: Add package method call in memory test

5. **Adjust thresholds** based on package type:

   | Package Type | Lag | Overhead | Memory | When to Use |
   |--------------|-----|----------|--------|-------------|
   | **Thin library** | 50ms | 10% | 300KB | Direct API wrappers with minimal transformation |
   | **SDK integration** | 80ms | 35% | 350KB | Moderate validation and data transformation |
   | **MCP server** | 100ms | 50% | 400KB | Includes stdio/JSON-RPC transport overhead |
   | **Complex framework** | 150ms | 75% | 500KB | Multiple abstraction layers, state management |

   Update thresholds at:
   - Lines ~783-784: `expect(processingLag).toBeLessThan(50)` and `expect(overheadPercent).toBeLessThan(10)`
   - Line ~823: `expect(heapGrowth).toBeLessThan(1024 * 300)`
   - Lines ~832-834: Console log output

6. **Add more API tests** (if needed):
   - Copy the `test.serial('Search API processing lag', ...)` pattern
   - Create separate tests for Express API, Contents API, or custom APIs
   - See `@youdotcom-oss/ai-sdk-plugin/src/tests/processing-lag.spec.ts` for multi-API example

7. **Verify before committing**:
   ```bash
   grep "TODO:" packages/{package-name}/tests/processing-lag.spec.ts && echo "❌ TODOs found!" || echo "✅ No TODOs"
   grep "{USER_AGENT_PREFIX}" packages/{package-name}/tests/processing-lag.spec.ts && echo "❌ Placeholders found!" || echo "✅ No placeholders"
   ```

**After creating the test file**, add your package's performance thresholds to `docs/PERFORMANCE.md`:

1. Open `docs/PERFORMANCE.md`
2. Find the "Package Performance Thresholds" section
3. Add a new subsection for your package following this format:

```markdown
### @youdotcom-oss/{package-name}
- **Processing lag**: < {X}ms
- **Overhead percentage**: < {Y}%
- **Memory overhead**: < {Z}KB
- **Test location**: `packages/{package-name}/src/tests/processing-lag.spec.ts`
- **Run tests**: `cd packages/{package-name} && bun test src/tests/processing-lag.spec.ts`
```

**Threshold Guidelines** (from `docs/PERFORMANCE.md`):
- **Thin library wrappers**: < 50ms lag, < 10% overhead, < 300KB memory
- **SDK integrations**: < 80ms lag, < 35% overhead, < 350KB memory
- **MCP servers**: < 100ms lag, < 50% overhead, < 400KB memory

Choose thresholds based on your package architecture. Document rationale if deviating from guidelines.

**Customization Required**:
1. Replace all `{placeholder}` values in the test file with actual package information
2. Add package thresholds to `docs/PERFORMANCE.md` under "Package Performance Thresholds"
3. Adjust thresholds based on your package's architecture

### 6. Create Publish Workflow

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
**Repository**: youdotcom-oss/dx-toolkit (monorepo)

---

## Next Steps (Manual)

### 1. Implement Package Logic

Now implement your package:
1. Edit `packages/{package-name}/src/utils.ts` - Add your public API
2. Create feature modules in `src/`
3. Add tests in `tests/`
4. Update `docs/API.md` with API documentation
5. Run `bun run check` to verify code quality

### 2. Test Publish Workflow

Before going live, test the publish workflow with a prerelease:

1. Go to: https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml
2. Click "Run workflow"
3. Enter inputs:
   - **version**: `0.1.0` (base version without "v" prefix)
   - **next**: `1` (creates version `0.1.0-next.1`)
4. Verify all workflow steps succeed:
   - ✅ Input validation passes
   - ✅ Version updated in package.json
   - ✅ GitHub release created
   - ✅ Published to npm with `next` tag

5. Verify prerelease:
   - npm: `npm view {npm-package-name}@next`
   - Should show version `0.1.0-next.1`

### 3. First Stable Release

When ready for first public release:
1. Push package code to main branch
2. Trigger publish workflow with version `0.1.0`
3. Verify npm package: https://www.npmjs.com/package/{npm-package-name}
4. Verify GitHub release: https://github.com/youdotcom-oss/dx-toolkit/releases
5. Test installation: `bun add {npm-package-name}`

---

## Package Structure Created

\`\`\`
packages/{package-name}/
├── src/
│   ├── main.ts
│   └── tests/
├── docs/
│   └── API.md
├── package.json
├── tsconfig.json
├── biome.json
├── README.md
└── AGENTS.md
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
