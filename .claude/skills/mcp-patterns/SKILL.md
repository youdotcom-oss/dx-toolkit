---
name: mcp-patterns
description: MCP server patterns - Zod schemas, error handling, logging, response format, testing. Uses @youdotcom-oss/api utilities.
license: MIT
compatibility: Bun >= 1.2.21, MCP SDK >= 1.24.3
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [mcp, model-context-protocol, zod, error-handling, logging]
---

# MCP Server Patterns

MCP server patterns using You.com API utilities from `@youdotcom-oss/api` package.

> **For end users**: See [packages/mcp/README.md](../../packages/mcp/README.md)  
> **For universal patterns**: See [`.plaited/rules/core.md`](../../.plaited/rules/core.md)

## When to Use

- Contributing to `@youdotcom-oss/mcp` package
- Implementing MCP tools
- Debugging MCP server issues

## Architecture

**MCP wraps API utilities as MCP tools:**
```
@youdotcom-oss/api (Foundation)
├── fetchSearchResults()
├── SearchQuerySchema
└── formatSearchResults()
         ↓
@youdotcom-oss/mcp (MCP Wrapper)
└── registerSearchTool() - Wraps API utility as MCP tool
```

## Tech Stack

- **MCP SDK**: @modelcontextprotocol/sdk ^1.24.3
- **API Utilities**: @youdotcom-oss/api ^0.1.0
- **HTTP Transport**: Hono ^4.10.7
- **Testing**: Bun test

## Quick Start

```bash
cd packages/mcp
bun test
bun run check
bun run dev      # STDIO mode
bun start        # HTTP mode
```

## MCP-Specific Patterns

### Schema Import from API Package

**ALWAYS import schemas from `@youdotcom-oss/api`:**

```typescript
// ✅ Import from API package
import { SearchQuerySchema } from '@youdotcom-oss/api';

export const registerSearchTool = (mcp: McpServer) => {
  mcp.tool('search', SearchQuerySchema, async (params) => {
    // ...
  });
};

// ❌ Don't duplicate schemas
const SearchQuerySchema = z.object({ /* ... */ });  // Wrong
```

*Verify:* `grep "z.object" src/*/register-*` should be empty  
*Fix:* Import schemas from `@youdotcom-oss/api`

### Tool Response Format

**Return both `content` and `structuredContent`:**

```typescript
return {
  content: [{ type: 'text', text: formatSearchResults(response) }],
  structuredContent: response  // Original API response
};
```

*Verify:* All tool handlers return both fields  
*Fix:* Add `structuredContent` with raw API response

### Error Handling - NEVER Throw

**MCP tools return errors, never throw:**

```typescript
// ✅ Return error as content
try {
  const result = await fetchSearchResults({ params, YDC_API_KEY, getUserAgent });
  return { content: [{ type: 'text', text: formatSearchResults(result) }] };
} catch (err: unknown) {
  return {
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true
  };
}

// ❌ Don't throw
throw new Error('API failed');  // Breaks MCP protocol
```

*Verify:* `grep 'throw new' src/*/register-*` returns nothing  
*Fix:* Convert throws to error returns

### Logging via MCP Protocol

**Use `getLogger(mcp)` not `console.log`:**

```typescript
// ✅ MCP notifications
const log = getLogger(mcp);
log('Calling You.com API');

// ❌ Bypasses protocol
console.log('Calling API');  // Interferes with stdio transport
```

*Verify:* `grep 'console.log' src/` in tool files  
*Fix:* Replace with `getLogger(mcp)`

### API Utility Usage

**Wrap API utilities, don't reimplement:**

```typescript
// ✅ Use API package utilities
import { fetchSearchResults, formatSearchResults } from '@youdotcom-oss/api';

const response = await fetchSearchResults({ params, YDC_API_KEY, getUserAgent });
const text = formatSearchResults(response);

// ❌ Don't duplicate fetch logic
const response = await fetch(url);  // Wrong - use API utility
```

*Verify:* No direct `fetch()` calls in tool files  
*Fix:* Use `@youdotcom-oss/api` utilities

## Testing

### Dedicated Clients for Long Tests

**Shared clients timeout on long tests, use dedicated:**

```typescript
// ✅ Dedicated client for long/isolated tests
test.serial('memory test', async () => {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: [stdioPath],
    env: { YDC_API_KEY },
  });

  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(transport);
  await client.callTool(/* ... */);
  await client.close();
}, { timeout: 15_000 });
```

*When*: Long tests (>30s), retry tests, performance tests  
*Verify*: Check test has `timeout` and dedicated client setup

## File Organization

```
src/
├── search/register-search-tool.ts     # Uses API utilities
├── contents/register-contents-tool.ts # Uses API utilities
├── get-mcp-server.ts                  # Server factory
├── stdio.ts                           # STDIO transport
├── http.ts                            # HTTP transport
└── utils.ts                           # Public exports
```

## Troubleshooting

**YDC_API_KEY not found:**
```bash
echo "export YDC_API_KEY=your-key" > .env
source .env
```

**Test failures with 429:**  
Wait before re-running, use `bun test --bail`

**Stdio connection issues:**  
```bash
bun run dev  # Verify server starts
echo $YDC_API_KEY  # Verify API key set
```

## Publishing

See [root AGENTS.md](../../AGENTS.md#publishing)

**MCP-specific**: Triggers deployment and Anthropic registry update

Workflow: `.github/workflows/publish-mcp.yml`

## Related Skills

- [`.claude/skills/api-patterns`](../api-patterns/SKILL.md) - Foundation API utilities
- [`.plaited/rules/core.md`](../../.plaited/rules/core.md) - Code patterns
- [`.plaited/rules/testing.md`](../../.plaited/rules/testing.md) - Test patterns

## Contributing

Package scope: `mcp` in commits

```bash
feat(mcp): add search filter
fix(mcp): resolve timeout
```
