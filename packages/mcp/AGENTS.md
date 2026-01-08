---
description: Development guidelines for You.com MCP Server using Bun runtime.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json"
alwaysApply: false
---

# You.com MCP Server Development Guide

A Model Context Protocol (MCP) server that provides web search, AI agent, and content extraction capabilities through You.com's APIs.

> **For end users**: See [README.md](./README.md) for setup and usage.
> **For universal patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

---

## Quick Start

```bash
# Setup
echo "export YDC_API_KEY=your-api-key" > .env
source .env

# Development
bun install                    # Install dependencies
bun run dev                    # Start stdio server
bun start                      # Start HTTP server on port 4000
bun test                       # Run tests
bun run check                  # Run all checks (biome + types + package)
bun run check:write            # Auto-fix all issues
```

## Code Style

> **For universal patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

## MCP-Specific Patterns

### Schema Design with Zod

All MCP tool inputs and API responses must use Zod schemas:

```ts
// ✅ Use .describe() for documentation (shows in MCP inspector)
export const SearchQuerySchema = z.object({
  query: z.string().describe('Search query string'),
  count: z.number().int().min(1).max(20).default(10).describe('Number of results'),
});

// ✅ Validate API responses
const response = SearchApiResponseSchema.parse(await apiCall());
```

### Error Handling

MCP tools must NEVER throw errors - always return error messages:

```ts
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

### Logging

Use `getLogger(mcp)` for MCP server notifications, NEVER `console.log`:

```ts
// ✅ Correct - MCP notifications
const log = getLogger(mcp);
log('Calling You.com API');

// ❌ Wrong - bypasses MCP protocol
console.log('Calling You.com API');
```

### Response Format

All MCP tools must return both `content` and `structuredContent`:

```ts
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

### MCP Inspector

Test and debug MCP tools interactively:

```bash
bun run inspect  # Automatically loads .env variables
```

## Testing

> **For universal test patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

### MCP-Specific Testing: Shared vs Dedicated Clients

Long-running tests with retries may disconnect shared MCP clients from `beforeAll`. Use dedicated clients for isolated tests:

```ts
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

## Related Skills

- [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md) - Universal code patterns
- [`.claude/rules/git-workflow.md`](../../.claude/rules/git-workflow.md) - Git conventions
- [`.claude/skills/documentation`](../../.claude/skills/documentation/SKILL.md) - Documentation standards

## Contributing

See [root AGENTS.md](../../AGENTS.md#contributing) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

**Package scope**: Use `mcp` in commit messages:

```bash
feat(mcp): add new search filter
fix(mcp): resolve timeout issue
```
