# Vercel AI SDK plugin for You.com - Development Guide

Developer documentation for contributors and AI coding agents.

> **For end users**: See [README.md](./README.md) for usage instructions.

---

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **AI SDK**: Vercel AI SDK ^5.0.0 (peer dependency)
- **MCP Client**: @ai-sdk/mcp ^0.3.0
- **Validation**: Zod ^4.1.13
- **Testing**: Bun test (built-in)
- **Code Quality**: Biome 2.3.8 (linter + formatter)
- **Type Checking**: TypeScript 5.9.3

## Quick Start

### Setup Environment

\`\`\`bash
# From package directory
cd packages/ai-sdk-plugin
bun install
\`\`\`

### Development Commands

\`\`\`bash
bun run dev              # Start in development mode (library - no server)
bun test                 # Run tests
bun run check            # All checks (biome + types + package)
bun run check:write      # Auto-fix all issues
\`\`\`

## Architecture

This package uses the **MCP Client Wrapper** pattern - a thin wrapper around Vercel's `experimental_createMCPClient()` that connects to the You.com MCP server.

\`\`\`
User Application
  ↓ import { createYouMCPClient }
@youdotcom-oss/ai-sdk-plugin
  ↓ experimental_createMCPClient()
@ai-sdk/mcp (Vercel's MCP client)
  ↓ HTTP + Bearer token
@youdotcom-oss/mcp (HTTP server)
  ↓ API calls
You.com APIs
\`\`\`

### Key Components

1. **src/types.ts** - TypeScript interfaces and error class
2. **src/constants.ts** - Default configuration values
3. **src/client.ts** - Core MCP client wrapper logic (~100 lines)
4. **src/index.ts** - Public API exports

## Code Style

This package uses [Biome](https://biomejs.dev/) for automated formatting and linting.

### Package-Specific Patterns

- **Arrow functions only** - All function declarations use arrow syntax
- **Error handling** - Use `YouMCPClientError` for all client errors
- **Async cleanup** - Always provide `close()` function in return type
- **Type exports** - Export both types and implementation

## Testing

### Test Structure

- **Unit tests**: `src/tests/client.spec.ts` - Test client logic without MCP server
- **Integration tests**: `src/tests/integration.spec.ts` - Test with running MCP server

### Running Tests

\`\`\`bash
bun test                       # All tests
bun test:coverage              # With coverage report
bun test:watch                 # Watch mode
\`\`\`

### Integration Test Requirements

Integration tests require:
1. `YDC_API_KEY` environment variable
2. MCP server running: `bun --cwd packages/mcp start`

Tests are automatically skipped if `YDC_API_KEY` is not set.

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Publishing

This package is published to npm via `.github/workflows/publish-ai-sdk-plugin.yml`.

**Version Format**: Exact versions only (no ^ or ~ prefixes)

See monorepo root [AGENTS.md](../../AGENTS.md) for publishing details.

## Implementation Notes

### MCP Client Wrapper Pattern

The wrapper pattern provides:
- ✅ Maximum code reuse (leverages existing MCP server)
- ✅ Minimal implementation (~100 lines)
- ✅ Automatic tool conversion (MCP → AI SDK tools)
- ✅ Inherits all MCP capabilities

### Why Not Native Tools?

Native tool implementations would require:
- ~1000+ lines of duplicate code
- Maintaining two implementations (MCP + native)
- No significant performance or feature benefits

The MCP wrapper is sufficient for v1. Native tools can be added later if needed based on user feedback.

## Troubleshooting

### Common Issues

**Error: API key required**
- Set `YDC_API_KEY` environment variable
- Or pass `apiKey` in config

**Error: Failed to create MCP client**
- Ensure MCP server is running on `http://localhost:4000/mcp`
- Check server health: `curl http://localhost:4000/mcp-health`

**Error: Failed to fetch tools from MCP server**
- Verify API key is valid
- Check MCP server logs for errors
- Ensure network connectivity

## Resources

- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **MCP Protocol**: https://modelcontextprotocol.io
- **You.com API**: https://you.com/platform/api-keys
