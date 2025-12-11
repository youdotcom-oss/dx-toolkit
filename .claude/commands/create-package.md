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

### Phase 3: Optional Features

**Question 5: Processing Lag Tests**
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

**Validation for Question 5**:
- Must be either "Yes" or "No" (case-insensitive)
- Store as boolean for conditional file creation

**Question 6: User-Agent Prefix (only if Question 5 = "Yes")**
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

**Validation for Question 6**:
- Only ask if processing lag tests enabled
- Pattern: `^[A-Z][A-Z0-9-]{1,9}$` (2-10 uppercase chars, can include hyphens)
- Examples: "MCP", "AI-SDK", "EVAL", "CLI"

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
3. **Exactly 4 steps in "Getting started"**
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

**ONLY create these files if user answered "Yes" to Question 5.**

**Important Note**: The root-level `docs/PERFORMANCE.md` already exists with general performance testing philosophy and methodology. Package-specific documentation should reference it and add package-specific details only.

**File: packages/{package-name}/tests/processing-lag.spec.ts**

This template is designed for packages that wrap You.com APIs. Customize the API endpoints, methods, and thresholds based on your package's specific needs.

```typescript
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { heapStats } from 'bun:jsc';
import packageJson from '../../package.json' with { type: 'json' };
// Import your package methods here
// import { yourPackageMethod } from '../src/your-module.ts';

/**
 * Processing Lag Test Suite
 *
 * Measures the overhead introduced by our abstraction layer compared to raw API calls.
 * We can't improve the You.com API performance itself, but we need to quantify what
 * processing lag our code adds.
 *
 * Metrics:
 * - Processing lag (absolute time difference)
 * - Overhead percentage (relative overhead)
 * - Memory overhead (heap growth)
 *
 * Thresholds:
 * - < 50ms absolute processing lag
 * - < 10% relative overhead
 * - < 300KB memory overhead (adjust based on your package's needs)
 */

// API Constants - UPDATE THESE for your package
const API_ENDPOINT = 'https://api.you.com/v1/your-endpoint'; // Replace with actual endpoint
const YDC_API_KEY = process.env.YDC_API_KEY ?? '';

// User-Agent format: {USER_AGENT_PREFIX}/{version} (You.com; {client})
const USER_AGENT = `{USER_AGENT_PREFIX}/${packageJson.version} (You.com; {package-name}-test)`;

beforeAll(async () => {
  console.log('\n=== Warming up ===');

  // Warmup: run your package method once to eliminate cold start effects
  console.log('Running warmup call to eliminate cold start effects...');

  // TODO: Replace with your package method
  // await yourPackageMethod({ /* test params */ });

  console.log('Warmup complete. Starting measurements...\n');
});

describe('Processing Lag: Package vs Raw API Calls', () => {
  const iterations = 10;

  test.serial('API processing lag', async () => {
    const rawTimes: number[] = [];
    const packageTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Raw API call (baseline) - UPDATE THIS based on your API
      const rawStart = performance.now();
      await fetch(API_ENDPOINT, {
        method: 'POST', // or 'GET' depending on your API
        headers: {
          // Use appropriate auth header for your API
          'X-API-Key': YDC_API_KEY, // or 'Authorization': `Bearer ${YDC_API_KEY}`
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          // Add your API request body here
          // Example: { query: 'test' }
        }),
      });
      rawTimes.push(performance.now() - rawStart);

      // Your package method (with abstraction overhead) - UPDATE THIS
      const packageStart = performance.now();
      // TODO: Replace with your actual package method call
      // await yourPackageMethod({ /* test params */ });
      packageTimes.push(performance.now() - packageStart);

      // Small delay between iterations to avoid rate limiting
      await Bun.sleep(100);
    }

    const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
    const avgPackage = packageTimes.reduce((a, b) => a + b) / iterations;
    const processingLag = avgPackage - avgRaw;
    const overheadPercent = (processingLag / avgRaw) * 100;

    console.log('\n=== API Processing Lag ===');
    console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
    console.log(`Package avg: ${avgPackage.toFixed(2)}ms`);
    console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
    console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

    // Assert processing lag thresholds
    expect(processingLag).toBeLessThan(50); // < 50ms absolute lag
    expect(overheadPercent).toBeLessThan(10); // < 10% relative overhead
  });

  test.serial('Memory overhead from package abstraction', async () => {
    // Force GC before measurement
    Bun.gc(true);
    await Bun.sleep(100); // Let GC complete

    const beforeHeap = heapStats();

    // Run multiple operations to measure sustained memory overhead
    for (let i = 0; i < 5; i++) {
      // TODO: Replace with your package method
      // await yourPackageMethod({ /* test params */ });
    }

    // Force GC after measurement
    Bun.gc(true);
    await Bun.sleep(100); // Let GC complete

    const afterHeap = heapStats();

    const heapGrowth = afterHeap.heapSize - beforeHeap.heapSize;
    console.log('\n=== Memory Overhead ===');
    console.log(`Heap before: ${(beforeHeap.heapSize / 1024).toFixed(2)} KB`);
    console.log(`Heap after: ${(afterHeap.heapSize / 1024).toFixed(2)} KB`);
    console.log(`Heap growth: ${(heapGrowth / 1024).toFixed(2)} KB`);

    // Assert memory overhead threshold
    // Adjust threshold based on your package's complexity
    expect(heapGrowth).toBeLessThan(1024 * 300); // < 300KB
  });
});

describe('Processing Lag Summary', () => {
  test('displays threshold information', () => {
    console.log('\n=== Processing Lag Thresholds ===');
    console.log('Absolute lag: < 50ms');
    console.log('Relative overhead: < 10%');
    console.log('Memory overhead: < 300KB');
    console.log('\nNote: These tests measure the overhead introduced by our');
    console.log('abstraction layer compared to raw API calls. We cannot improve');
    console.log('the You.com API performance itself, but we monitor what lag');
    console.log('our code adds to ensure it remains minimal.');
    expect(true).toBe(true);
  });
});
```

**Customization Instructions:**

After creating this file, you must:
1. Replace `{USER_AGENT_PREFIX}` with the user agent prefix from Question 6 (e.g., "MCP", "AI-SDK")
2. Replace `{package-name}` in USER_AGENT with your actual package name
3. Replace `API_ENDPOINT` with your actual You.com API endpoint
4. Update authentication headers (`X-API-Key` or `Authorization: Bearer`)
5. Replace `yourPackageMethod` with your actual package method calls
6. Update request parameters to match your API requirements
7. Adjust thresholds if needed (default: 50ms lag, 10% overhead, 300KB memory)
8. Add multiple test cases if your package wraps multiple APIs

**File: packages/{package-name}/docs/PERFORMANCE.md**

This document should reference the root performance philosophy and provide package-specific details.

```markdown
# {Package Name} Performance Testing

> **General methodology**: See [root performance philosophy](../../../docs/PERFORMANCE.md) for core concepts, metrics, and methodology.

This document covers {package-name}-specific performance testing details, including thresholds, test structure, and package-specific troubleshooting.

## Package-Specific Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Processing lag** | < 50ms | TODO: Explain why this threshold for your package architecture |
| **Overhead percentage** | < 10% | TODO: Explain acceptable overhead for your package |
| **Memory overhead** | < 300KB | TODO: Explain memory requirements for your package |

**Architecture considerations** (customize for your package):
- List key overhead sources (e.g., validation, transformation, protocol overhead)
- Explain why your thresholds differ from defaults (if they do)
- Document any package-specific performance characteristics

## Test Suite Structure

### Test File Location
`packages/{package-name}/tests/processing-lag.spec.ts`

### APIs Tested

#### API 1: {API Name}
- **Endpoint**: `{METHOD} https://api.you.com/v1/{endpoint}`
- **Authentication**: `{X-API-Key or Bearer}` header
- **Iterations**: {number}
- **Measures**: {what aspect of processing lag}

TODO: Add more APIs if your package wraps multiple endpoints

## Running Tests

### Basic Execution

```bash
cd packages/{package-name}

# Run processing lag tests
bun test tests/processing-lag.spec.ts

# Run with extended timeout if needed
bun test tests/processing-lag.spec.ts --timeout 60000
```

### Prerequisites

**Required**:
- `YDC_API_KEY` environment variable set
- TODO: List any package-specific prerequisites

**Recommended**:
- Stable network connection (no VPN)
- Minimal system load
- Recent `bun install`

### Example Output

```
=== {API Name} Processing Lag ===
Raw API avg: XXXms
Package avg: XXXms
Processing lag: XXms
Overhead: X.XX%

=== Memory Overhead ===
Heap before: XXXX KB
Heap after: XXXX KB
Heap growth: XXX KB

✓ All thresholds met
```

## Understanding Results

### Negative Processing Lag
TODO: Explain if/why your package might show negative lag

### Low Positive Lag (< threshold)
TODO: Explain what's normal for your package

### High Positive Lag (> threshold)
TODO: Explain when to investigate

## Package-Specific Troubleshooting

### Common Issue 1
**Symptom**: TODO: Describe symptom

**Cause**: TODO: Explain cause

**Solution**: TODO: Provide solution

TODO: Add more troubleshooting sections as needed

## Optimization Guidelines

TODO: Add package-specific optimization tips

## Continuous Monitoring

### In CI/CD
Processing lag tests run automatically on:
- Every pull request
- Main branch commits
- Release workflows

### Local Development
Run tests before committing:
```bash
bun test tests/processing-lag.spec.ts
```

## Related Documentation

- [Root Performance Philosophy](../../../docs/PERFORMANCE.md) - General methodology
- [Package README](../README.md) - Package overview
- [Development Guide](../AGENTS.md) - Contributing guidelines
```

**Customization Required**:
1. Replace all `{placeholder}` values with actual package information
2. Fill in all `TODO:` sections with package-specific details
3. Adjust thresholds based on your package's architecture
4. Add package-specific troubleshooting sections
5. Include optimization tips relevant to your package
6. Remove sections that don't apply to your package

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
│   └── utils.ts
├── tests/
├── docs/
│   └── API.md
├── package.json
├── tsconfig.json
├── biome.json
├── .gitignore
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
