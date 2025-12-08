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
- **Teams SDK**: @microsoft/teams.mcpclient ^2.0.4, @microsoft/teams.ai ^1.5.0

## Quick Start

### Setup Environment

```bash
# From package directory
cd packages/teams-mcp-client
bun install
```

### Development Commands

```bash
bun run dev              # Start in development mode
bun test                 # Run tests
bun run check            # All checks (biome + types + package)
bun run check:write      # Auto-fix all issues
```

## Code Style

This package uses [Biome](https://biomejs.dev/) for automated formatting and linting.

**Arrow Functions**: Always use arrow functions for declarations (not enforced by Biome)

```ts
// ✅ Preferred
export const createMcpPlugin = (config?: McpPluginConfig) => { ... };

// ❌ Avoid
export function createMcpPlugin(config?: McpPluginConfig) { ... }
```

**Error Handling**: Always use try/catch with typed error handling

```ts
try {
  const plugin = createPlugin(config);
  return { plugin, config };
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  throw new Error(`Failed to create MCP plugin: ${errorMessage}`);
}
```

## Architecture

This library provides a simple factory function `createMcpPlugin()` that:
1. Validates configuration (API key, MCP URL, headers)
2. Creates Microsoft Teams MCP client plugin instance
3. Configures connection to You.com's remote MCP server
4. Returns ready-to-use plugin + config

**Core Components**:
- `src/client/types.ts` - TypeScript interfaces
- `src/config/defaults.ts` - Default configuration values
- `src/config/config.ts` - Configuration management
- `src/shared/validators.ts` - Zod validation schemas
- `src/errors/error-handler.ts` - Error handling utilities
- `src/client/create-mcp-plugin.ts` - Main factory function
- `src/utils.ts` - Public API exports

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Publishing

This package is published to npm via `.github/workflows/publish-teams-mcp-client.yml`.

**Version Format**: Exact versions only (no ^ or ~ prefixes)

See monorepo root [AGENTS.md](../../AGENTS.md) for publishing details.
