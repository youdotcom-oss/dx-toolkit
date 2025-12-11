# Microsoft Teams integration library for You.com's MCP server - Development Guide

Developer documentation for contributors and AI coding agents.

> **For end users**: See [README.md](./README.md) for usage instructions.

---

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **Validation**: Zod ^4.1.13
- **Testing**: Bun test (built-in)
- **Code Quality**: Biome 2.3.8 (linter + formatter)
- **Type Checking**: TypeScript 5.9.3
- **Teams SDK**: @microsoft/teams.mcpclient ^2.0.4, @microsoft/teams.ai ^2.0.4

## Quick Start

### Setup Environment

```bash
# From package directory
cd packages/teams-mcp-client
bun install
```

### Development Commands

```bash
bun run dev              # Start in development mode (no-op for library)
bun test                 # Run tests
bun run check            # All checks (biome + types + package)
bun run check:write      # Auto-fix all issues
```

## Code Style

This package uses [Biome](https://biomejs.dev/) for automated formatting and linting.

### Package-Specific Patterns

**Arrow Functions**: Always use arrow functions for declarations

```ts
// ✅ Preferred
export const createMcpPlugin = (config?: McpPluginConfig) => { ... };

// ❌ Avoid
export function createMcpPlugin(config?: McpPluginConfig) { ... }
```

**Error Handling**: Always use try/catch with typed error handling

```ts
// ✅ Preferred
try {
  const plugin = createPlugin(config);
  return { plugin, config };
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  throw new McpPluginError(`Failed to create MCP plugin: ${errorMessage}`, ErrorCodes.PLUGIN_CREATION_FAILED);
}

// ❌ Avoid - Untyped catch
try {
  const plugin = createPlugin(config);
} catch (err) {  // Missing type annotation
  throw new Error(err.message);  // Assumes err is Error
}
```

**Configuration Validation**: Use Zod schemas with explicit error messages

```ts
// ✅ Preferred
export const McpPluginConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key cannot be empty'),
  mcpUrl: z.string().url('MCP URL must be a valid URL'),
  timeout: z.number().positive().max(300000, 'Timeout must be ≤ 5 minutes'),
});

// ❌ Avoid - Missing validation messages
export const McpPluginConfigSchema = z.object({
  apiKey: z.string(),
  mcpUrl: z.string(),
  timeout: z.number(),
});
```

**Type Exports**: Always export types separately from implementations

```ts
// ✅ Preferred (src/utils.ts:8-12)
export type {
  ExtendedMcpPluginConfig,
  McpPluginConfig,
  McpPluginResult,
} from './client/types.ts';

// ❌ Avoid - Mixed exports
export { createMcpPlugin, McpPluginConfig } from './client/create-mcp-plugin.ts';
```

**Default Values**: Use constants for defaults, not inline literals

```ts
// ✅ Preferred (src/config/defaults.ts:1-21)
export const DEFAULT_MCP_URL = 'https://api.you.com/mcp';
export const DEFAULT_TIMEOUT = 30000;

// ❌ Avoid - Inline literals
const timeout = config.timeout ?? 30000;
const mcpUrl = config.mcpUrl ?? 'https://api.you.com/mcp';
```

**Debug Logging**: Use Biome ignore comments for intentional console usage

```ts
// ✅ Preferred (src/client/create-mcp-plugin.ts:54-60)
if (validatedConfig.debug) {
  // biome-ignore lint/suspicious/noConsole: Debug logging is intentional
  console.log('[teams-mcp-client] Plugin created successfully');
}

// ❌ Avoid - Console without justification
console.log('Plugin created');  // Will fail Biome check
```

## Architecture

This library provides a simple factory function `createMcpPlugin()` that:
1. Validates configuration (API key, MCP URL, headers)
2. Creates Microsoft Teams MCP client plugin instance
3. Configures connection to You.com's remote MCP server
4. Returns ready-to-use plugin + config

### Core Components

- `src/client/types.ts` - TypeScript interfaces for plugin configuration
- `src/config/defaults.ts` - Default configuration values (MCP URL, timeout, headers)
- `src/config/config.ts` - Configuration merging and validation logic
- `src/shared/validators.ts` - Zod validation schemas with error messages
- `src/errors/error-handler.ts` - Error handling utilities and custom error class
- `src/client/create-mcp-plugin.ts` - Main factory function for plugin creation
- `src/utils.ts` - Public API exports (types, functions, constants)

### Request Flow

1. User calls `createMcpPlugin(config?)` with optional configuration
2. `mergeConfig()` merges user config with defaults (src/config/config.ts:11-24)
3. Zod validates merged config against `McpPluginConfigSchema` (src/shared/validators.ts:6-22)
4. Factory builds MCP client config with Authorization header (src/client/create-mcp-plugin.ts:34-43)
5. `new McpClientPlugin()` instantiates Teams SDK plugin (src/client/create-mcp-plugin.ts:46-51)
6. Returns plugin + validated config to user (src/client/create-mcp-plugin.ts:63-70)

### Error Flow

1. Validation errors throw `McpPluginError` with `INVALID_CONFIG` code
2. Missing API key throws `McpPluginError` with `MISSING_API_KEY` code
3. Plugin creation errors throw `McpPluginError` with `PLUGIN_CREATION_FAILED` code
4. All errors include original error message wrapped via `wrapError()` (src/errors/error-handler.ts:24-34)

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Publishing

This package is published to npm via `.github/workflows/publish-teams-mcp-client.yml`.

**Version Format**: Exact versions only (no ^ or ~ prefixes)

See monorepo root [AGENTS.md](../../AGENTS.md) for publishing details.

## Troubleshooting

### Common Issues

#### Symptom: "API key cannot be empty" validation error

**Cause**: Zod schema validation fails when API key is empty string or undefined

**Solution**:

```bash
# Verify environment variable is set
echo $YDC_API_KEY

# If empty, set it
export YDC_API_KEY=your-actual-api-key-here

# Or pass explicitly in code
const { plugin, config } = createMcpPlugin({
  apiKey: 'your-api-key',
});
```

**Code Reference**: Validation occurs in src/shared/validators.ts:8

#### Symptom: TypeScript error "Property 'plugin' does not exist on type 'McpPluginResult'"

**Cause**: Incorrect type import or missing type declaration

**Solution**:

```ts
// ✅ Correct import
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';
import type { McpPluginResult } from '@youdotcom-oss/teams-mcp-client';

// ❌ Missing type import
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';
const result = createMcpPlugin();  // TypeScript doesn't know result type
```

**Code Reference**: Type definitions in src/client/types.ts:14-23

#### Symptom: Biome lint error "Unexpected console statement"

**Cause**: Console.log used without Biome ignore comment

**Solution**:

```ts
// ✅ For debug logging
if (config.debug) {
  // biome-ignore lint/suspicious/noConsole: Debug logging is intentional
  console.log('[teams-mcp-client] Debug message');
}

// ❌ Never use console without justification
console.log('Some message');
```

**Code Reference**: Example in src/client/create-mcp-plugin.ts:54-60

#### Symptom: Tests fail with "YDC_API_KEY is required"

**Cause**: Test environment missing API key environment variable

**Solution**:

```bash
# Set in test environment
export YDC_API_KEY=test-api-key-for-unit-tests

# Or mock in test
vi.stubEnv('YDC_API_KEY', 'test-api-key');
```

**Code Reference**: Config merging in src/config/config.ts:11-24

#### Symptom: Package build fails with "Cannot find module './utils.ts'"

**Cause**: Incorrect import extension or missing file

**Solution**:

```bash
# Verify file exists
ls -la src/utils.ts

# Check import uses .ts extension (not .js)
grep "from './utils" src/**/*.ts

# Rebuild
bun run check:types
```

**Code Reference**: Main export in src/utils.ts:1-32

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test:coverage

# Watch mode
bun test:watch
```

### Test Structure

- `src/client/tests/create-mcp-plugin.spec.ts` - Factory function tests
- `src/config/tests/config.spec.ts` - Configuration merging tests
- `src/errors/tests/error-handler.spec.ts` - Error handling tests
- `src/shared/tests/validators.spec.ts` - Zod schema validation tests

### Test Patterns

**Use descriptive test names** with expected behavior:

```ts
// ✅ Preferred
test('should throw McpPluginError when API key is missing', () => {
  expect(() => createMcpPlugin({ apiKey: '' })).toThrow(McpPluginError);
});

// ❌ Avoid vague names
test('API key test', () => {
  expect(() => createMcpPlugin({ apiKey: '' })).toThrow();
});
```

**Mock environment variables** for predictable tests:

```ts
// ✅ Preferred
import { beforeEach, afterEach, vi } from 'bun:test';

beforeEach(() => {
  vi.stubEnv('YDC_API_KEY', 'test-api-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```
