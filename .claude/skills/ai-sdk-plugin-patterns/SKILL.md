---
name: ai-sdk-plugin-patterns
description: Vercel AI SDK plugin development patterns including tool configuration, schema validation, API key handling, and response formatting. Use when developing or contributing to @youdotcom-oss/ai-sdk-plugin package.
license: MIT
compatibility: Bun >= 1.2.21, AI SDK >= 5.0.0
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [ai-sdk, vercel, tool-development, api-integration, zod]
---

# AI SDK Plugin Development Patterns

Development patterns for building Vercel AI SDK plugins that integrate You.com APIs as native AI SDK tools.

> **For end users**: See [packages/ai-sdk-plugin/README.md](../../packages/ai-sdk-plugin/README.md) for setup and usage.
> **For universal patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

## When to Use This Skill

Use this skill when:
- Developing or contributing to `@youdotcom-oss/ai-sdk-plugin` package
- Implementing AI SDK tools
- Debugging AI SDK integration issues
- Understanding AI SDK tool patterns and conventions

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **Framework**: Vercel AI SDK ^5.0.0
- **MCP Utilities**: @youdotcom-oss/mcp ^1.3.8 (API calls, schemas, formatters)
- **Validation**: Zod ^4.1.13 (via @youdotcom-oss/mcp)
- **Testing**: Bun test (built-in test runner)
- **Code Quality**: Biome 2.3.8 (linter + formatter)

## Quick Start

```bash
cd packages/ai-sdk-plugin

# Install dependencies (from monorepo root)
cd ../..
bun install

# Set up API keys
echo "export YDC_API_KEY=your-youdotcom-api-key-here" > .env
echo "export ANTHROPIC_API_KEY=your-anthropic-api-key-here" >> .env
source .env

# From package directory
cd packages/ai-sdk-plugin
bun test                       # Run all tests
bun run check                  # Run all checks
```

## Exploring the Package

> **For TypeScript code exploration**: See [`.claude/skills/typescript-lsp`](../typescript-lsp/) for LSP-based analysis tools.

Use the typescript-lsp skill to understand the AI SDK plugin codebase:

```bash
# Get type information for a tool export
bun .claude/skills/typescript-lsp/scripts/lsp-hover.ts packages/ai-sdk-plugin/src/main.ts 48 13

# List all exports (youSearch, youExpress, youContents)
bun .claude/skills/typescript-lsp/scripts/lsp-analyze.ts packages/ai-sdk-plugin/src/main.ts --exports

# Find references to a specific tool
bun .claude/skills/typescript-lsp/scripts/lsp-references.ts packages/ai-sdk-plugin/src/main.ts 48 13

# Search for schema imports from @youdotcom-oss/mcp
bun .claude/skills/typescript-lsp/scripts/lsp-find.ts SearchQuerySchema

# Explore tool configuration structure
bun .claude/skills/typescript-lsp/scripts/lsp-symbols.ts packages/ai-sdk-plugin/src/main.ts
```

**When to use LSP tools:**
- Understanding AI SDK tool wrapper patterns
- Verifying schema imports from @youdotcom-oss/mcp
- Exploring response formatting utilities
- Checking tool configuration types
- Finding API key handling patterns

## AI SDK-Specific Patterns

### AI SDK Tool Pattern

Each tool function follows this pattern:

```typescript
export const youToolName = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description: 'Tool description for AI model',
    inputSchema: ZodSchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required');
      }

      const response = await callApiUtility({
        params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      });

      return {
        text: formatResponse(response),
        data: response,
      };
    },
  });
};
```

**Key components**:
- `config` - Optional configuration with API key
- `tool()` - AI SDK tool wrapper
- `inputSchema` - Zod schema for parameter validation
- `execute()` - Async function that calls You.com API
- Returns `{ text, data }` - Text for AI model, structured data for inspection

### Tool Description Best Practices

Write tool descriptions for AI models, not humans:

```typescript
// ✅ Good - Clear, actionable, includes use cases
description: 'Search the web for current information. Use for news, facts, weather, recent events, or any query requiring up-to-date data from the internet.'

// ❌ Bad - Too technical, focused on implementation
description: 'Executes HTTP GET request to You.com Search API with query parameters and returns JSON response with web results.'

// ❌ Bad - Too generic
description: 'Web search tool'
```

**Why this matters:**
- AI models use descriptions to decide when to invoke tools
- Clear descriptions improve tool selection accuracy
- Include use cases helps models understand appropriate contexts

### API Key Handling

Always provide API key via config or environment:

```typescript
// ✅ From environment variable
const search = youSearch();

// ✅ From config
const search = youSearch({ apiKey: process.env.YDC_API_KEY });

// ❌ Will fail at execution time
const search = youSearch({ apiKey: '' });
```

**Validate API key before API calls**:

```typescript
// ✅ Check API key in execute function
execute: async (params) => {
  if (!apiKey) {
    throw new Error('YDC_API_KEY is required');
  }
  const response = await callApi(...);
}

// ❌ Don't skip validation
execute: async (params) => {
  const response = await callApi(...); // May fail with unclear error
}
```

### Response Format

**Always return both text and structured data**:

```typescript
// ✅ Return both formats
return {
  text: formatSearchResults(response),  // For AI model
  data: response,                        // For inspection/debugging
};

// ❌ Don't return only text
return formatSearchResults(response);

// ❌ Don't return only data
return response;
```

**Text format should be human-readable**:

```typescript
// ✅ Formatted for readability
text: `Found 10 results:

1. Example.com
   Latest AI developments in 2025
   https://example.com/ai

2. Tech News
   Breaking: New AI model released
   https://technews.com/new-model`

// ❌ JSON dump
text: JSON.stringify(results)

// ❌ Raw API response
text: results.toString()
```

### Input Schema Patterns

Use schemas from `@youdotcom-oss/mcp` for consistency:

```typescript
import { SearchQuerySchema } from '@youdotcom-oss/mcp';

export const youSearch = (config: YouToolsConfig = {}) => {
  return tool({
    description: '...',
    inputSchema: SearchQuerySchema, // ✅ Reuse existing schema
    execute: async (params) => { ... }
  });
};
```

**Why reuse schemas?**
- Single source of truth for API parameters
- Consistent validation across MCP server and AI SDK plugin
- Automatic updates when API parameters change

## Architecture

### System Overview

This plugin provides a thin integration layer between Vercel AI SDK and You.com APIs:

```
AI SDK generateText/streamText
         ↓
   tool() wrapper
         ↓
   youSearch/youExpress/youContents
         ↓
   @youdotcom-oss/mcp utilities
   (API calls, validation, formatting)
         ↓
   You.com APIs
```

### Design Philosophy

**Minimal Abstraction**: This plugin adds minimal overhead over direct API calls. The `tool()` wrapper provides:

1. **AI SDK Integration** - Native tool format for `generateText()` and `streamText()`
2. **Schema Validation** - Zod schemas from `@youdotcom-oss/mcp` for input validation
3. **API Key Management** - Handles API key from config or environment variable
4. **Response Formatting** - Returns both text and structured data for AI SDK

**No MCP Client**: Unlike the `@youdotcom-oss/mcp` package which provides an MCP server, this plugin directly wraps You.com API utilities as AI SDK tools. There is NO MCP client wrapper layer.

### Core Files

```
packages/ai-sdk-plugin/
├── src/
│   ├── main.ts                      # Tool exports (youSearch, youExpress, youContents)
│   └── tests/
│       └── integration.spec.ts      # End-to-end tool tests
├── examples/                        # Usage examples
├── package.json                     # Package configuration
└── README.md                        # User documentation
```

## Available Tools

### youSearch()

Web and news search using You.com Search API.

**File**: `src/main.ts:48-73`

**Schema**: Imported from `@youdotcom-oss/mcp` (`SearchQuerySchema`)

**Parameters**:
- `query` (string) - Search query
- `count` (number, optional) - Number of results
- `country` (string, optional) - Country code filter
- `safesearch` (string, optional) - Safe search level
- `freshness` (string, optional) - Time range filter
- `livecrawl` (string, optional) - Live-crawl sections for full content
- `livecrawl_formats` (string, optional) - Format for crawled content

### youExpress()

Fast AI agent with web search integration.

**File**: `src/main.ts:98-123`

**Schema**: Imported from `@youdotcom-oss/mcp` (`ExpressAgentInputSchema`)

**Parameters**:
- `input` (string) - Query or prompt
- `tools` (array, optional) - Enable web search (default: enabled)

### youContents()

Web page content extraction in markdown or HTML format.

**File**: `src/main.ts:148-173`

**Schema**: Imported from `@youdotcom-oss/mcp` (`ContentsQuerySchema`)

**Parameters**:
- `urls` (array) - URLs to extract content from
- `format` (string, optional) - Output format ('markdown' or 'html')

## Testing

### Integration Tests

`src/tests/integration.spec.ts`:
- Test all three tools with real API calls
- Test error handling (missing API key, invalid key)
- Test tool composition (multiple tools together)
- Test with different AI models
- Test streaming responses

### Running Tests

```bash
# All tests
bun test

# Integration tests only
bun test src/tests/integration.spec.ts

# Coverage report
bun test:coverage

# Watch mode
bun test:watch
```

**Prerequisites**:
- `YDC_API_KEY` environment variable
- `ANTHROPIC_API_KEY` environment variable
- Stable network connection

## Troubleshooting

### Missing API Key

**Symptom**: Error "YDC_API_KEY is required"

**Solution**:
```bash
echo "export YDC_API_KEY=your-key-here" > .env
source .env

# Verify
echo $YDC_API_KEY
```

### Type Errors with tool.execute()

**Symptom**: TypeScript error "Expected 2 arguments"

**Cause**: AI SDK `tool.execute()` requires `ToolCallOptions` parameter

**Solution**:
```typescript
// ✅ Provide toolCallId and messages
await tool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] });

// ❌ Missing second parameter
await tool.execute?.({ query: 'test' });
```

### Test Failures with Rate Limits

**Symptom**: Tests fail with 429 errors

**Solution**:
- Wait a few minutes before re-running
- Tests use `retry: 2` to handle transient failures
- Run specific test suites instead of all tests
- Check API key rate limits at [you.com/platform](https://you.com/platform/api-keys)

## Publishing

See [root AGENTS.md](../../AGENTS.md#monorepo-architecture) for workflow documentation. This package uses the shared `.github/workflows/_publish-package.yml` workflow.

**Package-specific**: Workflow name is "Publish ai-sdk-plugin Release"

## Related Skills

- [`.claude/skills/typescript-lsp`](../typescript-lsp/) - TypeScript code exploration with LSP
- [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md) - Universal code patterns
- [`.claude/rules/git-workflow.md`](../../.claude/rules/git-workflow.md) - Git conventions
- [`.claude/skills/documentation`](../../.claude/skills/documentation/) - Documentation standards

## Contributing

See [root AGENTS.md](../../AGENTS.md#contributing) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

**Package-specific scope**: Use `ai-sdk-plugin` scope in commit messages:

```bash
feat(ai-sdk-plugin): add support for image search
fix(ai-sdk-plugin): handle empty search results
```
