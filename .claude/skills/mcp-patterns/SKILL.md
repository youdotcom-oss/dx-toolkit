---
name: mcp-patterns
description: MCP server development patterns including Zod schema design, error handling, logging, response format, and testing strategies. Use when developing or contributing to @youdotcom-oss/mcp package.
license: MIT
compatibility: Bun >= 1.2.21, MCP SDK >= 1.24.3
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [mcp, model-context-protocol, zod, error-handling, logging]
---

# MCP Server Development Patterns

Development patterns for building MCP (Model Context Protocol) servers with the You.com MCP package.

> **For end users**: See [packages/mcp/README.md](../../packages/mcp/README.md) for setup and usage.
> **For universal patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

## When to Use This Skill

Use this skill when:
- Developing or contributing to `@youdotcom-oss/mcp` package
- Implementing MCP tools and utilities
- Debugging MCP server issues
- Understanding MCP-specific patterns and conventions

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **MCP SDK**: @modelcontextprotocol/sdk ^1.24.3
- **Validation**: Zod ^4.1.13
- **HTTP Transport**: Hono ^4.10.7 with Bearer token auth
- **Testing**: Bun test (built-in test runner)
- **Code Quality**: Biome 2.3.8 (linter + formatter)

## Quick Start

```bash
cd packages/mcp

# Install dependencies (from monorepo root)
cd ../..
bun install

# Set up API key
echo "export YDC_API_KEY=your-actual-api-key-here" > .env
source .env

# From package directory
cd packages/mcp
bun run dev                    # Start stdio server
bun start                      # Start HTTP server on port 4000
bun test                       # Run tests
bun run check                  # Run all checks
```

## MCP-Specific Patterns

### Schema Design with Zod

All MCP tool inputs and API responses must use Zod schemas:

```typescript
// ✅ Use .describe() for documentation (shows in MCP inspector)
export const SearchQuerySchema = z.object({
  query: z.string().describe('Search query string'),
  count: z.number().int().min(1).max(20).default(10).describe('Number of results'),
});

// ✅ Validate API responses
const response = SearchApiResponseSchema.parse(await apiCall());
```

**Why this pattern?**
- `.describe()` provides human-readable documentation in MCP inspector
- Zod validation catches API response format changes early
- Type safety ensures tool inputs match expected schema

### Error Handling

MCP tools must NEVER throw errors - always return error messages:

```typescript
// ✅ Correct - return error as content
try {
  const result = await apiCall();
  return { content: [{ type: 'text', text: result }] };
} catch (err: unknown) {
  const error = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: 'text', text: `Error: ${error}` }],
    isError: true
  };
}

// ❌ Wrong - throwing breaks MCP protocol
throw new Error('API failed');
```

**Why this pattern?**
- MCP protocol expects all tool calls to return responses
- Throwing errors breaks the client-server connection
- `isError: true` flag allows clients to handle errors gracefully

### Logging

Use `getLogger(mcp)` for MCP server notifications, NEVER `console.log`:

```typescript
// ✅ Correct - MCP notifications
const log = getLogger(mcp);
log('Calling You.com API');

// ❌ Wrong - bypasses MCP protocol
console.log('Calling You.com API');
```

**Why this pattern?**
- MCP clients expect structured notifications via protocol
- `console.log` outputs to stdout, interfering with stdio transport
- `getLogger()` properly routes messages through MCP notification system

### Response Format

All MCP tools must return both `content` and `structuredContent`:

```typescript
return {
  content: [
    { type: 'text', text: 'User-readable summary' }
  ],
  structuredContent: {
    results: [...], // Structured data
    metadata: {...}
  }
};
```

**Why this pattern?**
- `content` provides human-readable text for display
- `structuredContent` enables programmatic processing by clients
- Both formats serve different use cases

### MCP Inspector

Test and debug MCP tools interactively:

```bash
bun run inspect  # Automatically loads .env variables
```

**Why this tool?**
- Interactive testing without writing test code
- Visual inspection of tool schemas and responses
- Quick validation of changes during development

## Testing

### MCP-Specific Testing: Shared vs Dedicated Clients

Long-running tests with retries may disconnect shared MCP clients from `beforeAll`. Use dedicated clients for isolated tests:

```typescript
// ✅ Dedicated client for long-running or isolated tests
test.serial('memory test', async () => {
  const stdioPath = Bun.resolveSync('../../bin/stdio', import.meta.dir);
  const transport = new StdioClientTransport({
    command: 'npx',
    args: [stdioPath],
    env: { YDC_API_KEY },
  });

  const memoryClient = new Client({
    name: 'memory-test-client',
    version: '1.0.0',
  });

  await memoryClient.connect(transport);
  await memoryClient.callTool(/* ... */);
  await memoryClient.close();
}, { timeout: 15_000 });
```

**When to use:**
- **Shared client**: Quick tests (<30s), no retry, basic integration tests
- **Dedicated client**: Long tests (>30s), tests with retry, performance tests

See `src/tests/processing-lag.spec.ts` for complete example.

## Architecture

### Request Flow

**Stdio Transport** (Local Development):
1. MCP Client → stdin → `stdio.ts` → MCP Server → You.com API → stdout → MCP Client

**HTTP Transport** (Remote Deployment):
1. MCP Client → SSE (`/mcp`) → `http.ts` (Bearer auth) → MCP Server → You.com API → SSE → MCP Client

### Core Files

- `src/stdio.ts` - Stdio transport entry point
- `src/http.ts` - HTTP transport with Bearer token auth, `/mcp` (SSE), `/mcp-health`
- `src/get-mcp-server.ts` - MCP server factory
- `src/*/register-*-tool.ts` - Tool registration
- `src/*/*.schemas.ts` - Zod schemas
- `src/*/*.utils.ts` - API calls, formatting
- `src/utils.ts` - Public API export for library consumers

## Troubleshooting

### YDC_API_KEY not found

```bash
echo "export YDC_API_KEY=your-actual-api-key-here" > .env
source .env
echo $YDC_API_KEY  # Verify it's set
```

### Test Failures with API Rate Limits

**Symptom**: Tests fail with 429 (Too Many Requests)

**Solution**:
- Wait a few minutes before re-running tests
- Run specific test suites instead of all at once
- Use `bun test --bail` to stop after first failure
- Check rate limits at [api.you.com](https://api.you.com)

### MCP Client Connection Issues (Stdio)

```bash
# Verify server starts
bun run dev

# Check API key is set
echo $YDC_API_KEY
```

### MCP Client Connection Issues (HTTP)

```bash
# Verify server starts on port 4000
bun start

# Test health endpoint
curl http://localhost:4000/mcp-health

# Test with valid Bearer token
curl -H "Authorization: Bearer your-key-here" \
  http://localhost:4000/mcp
```

## Publishing

> **For standard publishing process**: See [root AGENTS.md](../../AGENTS.md#publishing)

### MCP-Specific Deployment

After npm publish, this package triggers:

1. **Remote Deployment** (via `repository_dispatch`):
   - `update-mcp-version` event to deployment repository
   - Stable releases: `deploy-mcp-production` after version update completes
   - Prereleases skip production deployment

2. **Anthropic MCP Registry** (stable releases only):
   - Auto-updates `server.json` versions
   - Makes server discoverable at `io.github.youdotcom-oss/mcp`
   - Runs after successful production deployment

**Workflow**: `.github/workflows/publish-mcp.yml`

## Related Skills

- [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md) - Universal code patterns
- [`.claude/rules/git-workflow.md`](../../.claude/rules/git-workflow.md) - Git conventions
- [`.claude/skills/documentation`](../../.claude/skills/documentation/) - Documentation standards

## Contributing

See [root AGENTS.md](../../AGENTS.md#contributing) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

**Package scope**: Use `mcp` in commit messages:

```bash
feat(mcp): add new search filter
fix(mcp): resolve timeout issue
```
