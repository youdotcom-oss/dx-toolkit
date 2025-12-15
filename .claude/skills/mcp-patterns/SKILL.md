---
name: mcp-patterns
description: MCP server development patterns for dx-toolkit - schema design, error handling, logging, response format
---

# MCP Server Development Patterns

Package-specific patterns for `@youdotcom-oss/mcp`. Use these patterns when developing MCP tools and server functionality.

---

## Schema Design

Always use Zod for input/output validation

```ts
export const MyToolInputSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().optional().describe("Max results"),
});
```

**Why this pattern?**
- Zod provides runtime validation and TypeScript types
- `.describe()` adds documentation for MCP tool parameters
- Schema validation catches invalid inputs before API calls
- Type inference from schema ensures type safety

**Best practices**:
- Use `.min(1)` for required strings
- Use `.optional()` for optional parameters
- Always include `.describe()` for user-facing parameter descriptions
- Export schemas for reuse in tests and documentation

## Error Handling

Always use try/catch with typed error handling

```ts
try {
  const response = await apiCall();
  return formatResponse(response);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  await logger({ level: "error", data: `API call failed: ${errorMessage}` });
  return {
    content: [{ type: "text", text: `Error: ${errorMessage}` }],
    isError: true,
  };
}
```

**Why this pattern?**
- MCP tools must return structured responses, never throw
- `err: unknown` ensures type safety in catch blocks
- Logging errors helps with debugging
- `isError: true` signals error state to MCP client
- User-friendly error messages in `content`

**Best practices**:
- Always catch errors at tool handler level
- Log errors before returning
- Include context in error messages
- Return MCP-compatible error response format

## Logging

Use `getLogger(mcp)` helper, never console.log

```ts
import { getLogger } from "../shared/get-logger.ts";

const logger = getLogger(mcp);
await logger({ level: "info", data: `Operation successful: ${result}` });
await logger({ level: "error", data: `Operation failed: ${errorMessage}` });
```

**Why this pattern?**
- MCP server logging uses server notification protocol
- `console.log` doesn't integrate with MCP clients
- `getLogger` provides proper MCP server notifications
- Logs appear in MCP client debug output

**Best practices**:
- Use "info" level for successful operations
- Use "error" level for failures
- Include operation context in log messages
- Never use console.log, console.error, or console.warn

## Response Format

Return both `content` and `structuredContent`

```ts
return {
  content: [{ type: "text", text: formattedText }],
  structuredContent: responseData,
};
```

**Why this pattern?**
- `content` provides human-readable text for display
- `structuredContent` provides machine-readable data
- MCP clients can choose which format to use
- Enables both UI display and programmatic access

**Best practices**:
- Format text for readability (proper line breaks, formatting)
- Include all relevant data in structured content
- Keep structured content JSON-serializable
- Use consistent formatting across tools

## Tool Registration

Use Zod schemas for tool parameter validation. See examples:

- Search tool: `src/search/register-search-tool.ts:7-86`
- Express tool: `src/express/register-express-tool.ts:7-66`
- Contents tool: `src/contents/register-contents-tool.ts:7-89`

**Pattern**:
```ts
mcp.tool(
  'tool-name',
  'Tool description for MCP clients',
  MyToolInputSchema,
  async (params) => {
    // Tool implementation
    try {
      const result = await apiCall(params);
      return {
        content: [{ type: "text", text: formatResult(result) }],
        structuredContent: result,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await logger({ level: "error", data: errorMessage });
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);
```

## Error Reporting

Include mailto links in error logs using `generateErrorReportLink()` helper (`src/shared/generate-error-report-link.ts:6-37`). This creates one-click error reporting with full diagnostic context.

**Usage**:
```ts
import { generateErrorReportLink } from "../shared/generate-error-report-link.ts";

const errorReportLink = generateErrorReportLink({
  subject: "MCP Tool Error",
  toolName: "you-search",
  errorMessage: err.message,
  context: { query: params.query },
});

await logger({
  level: "error",
  data: `Operation failed. Report: ${errorReportLink}`
});
```

## Related Resources

- MCP Specification: https://modelcontextprotocol.io/docs/specification
- Zod Documentation: https://zod.dev
- Package AGENTS.md: `packages/mcp/AGENTS.md`
- MCP Inspector: Run `bun run inspect` for interactive testing
