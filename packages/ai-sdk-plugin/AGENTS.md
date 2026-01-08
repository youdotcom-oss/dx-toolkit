# Vercel AI SDK Plugin for You.com - Development Guide

A Vercel AI SDK plugin providing You.com's search, AI agent, and content extraction capabilities as native AI SDK tools.

---

> **Note for end users**: If you want to use this plugin (not develop or contribute), see [README.md](./README.md) for setup and usage.

**This guide (AGENTS.md) is for developers, contributors, and AI coding agents** who want to:

- Set up a local development environment
- Understand the plugin architecture
- Contribute code or bug fixes
- Run tests and quality checks
- Review pull requests

---

## Tech Stack

- **Runtime**: Bun >= 1.2.21 (not Node.js)
- **Framework**: Vercel AI SDK ^5.0.0
- **MCP Utilities**: @youdotcom-oss/mcp ^1.3.8 (API calls, schemas, formatters)
- **Validation**: Zod ^4.1.13 (via @youdotcom-oss/mcp)
- **Testing**: Bun test (built-in test runner)
- **Code Quality**: Biome 2.3.8 (linter + formatter)
- **Type Checking**: TypeScript 5.9.3

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
bun run check                  # Run all checks (biome + types)
```

## Code Style

> **For universal patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

## AI SDK-Specific Patterns

> **For AI SDK tool patterns**: See [`.claude/skills/ai-sdk-patterns`](../../.claude/skills/ai-sdk-patterns/SKILL.md)

The ai-sdk-patterns skill covers:
- Tool description best practices (write for AI models, not humans)
- Input schema patterns (use schemas from `@youdotcom-oss/mcp`)
- API key handling (automatic environment variable fallback)
- Raw response returns (maximum flexibility for consumers)
- Schema-driven smart queries

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

> **For universal test patterns**: See [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md)

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

### Integration Tests

`src/tests/integration.spec.ts`:
- Test all three tools with real API calls
- Test error handling (missing API key, invalid key)
- Test tool composition (multiple tools together)
- Test with different AI models
- Test streaming responses

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

## Contributing

See [root AGENTS.md](../../AGENTS.md#contributing) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

**Package-specific scope**: Use `ai-sdk-plugin` scope in commit messages:

```bash
feat(ai-sdk-plugin): add support for image search
fix(ai-sdk-plugin): handle empty search results
```

## Publishing

See [root AGENTS.md](../../AGENTS.md#monorepo-architecture) for workflow documentation. This package uses the shared `.github/workflows/_publish-package.yml` workflow.

**Package-specific**: Workflow name is "Publish ai-sdk-plugin Release"

## Related Skills

- [`.claude/skills/ai-sdk-patterns`](../../.claude/skills/ai-sdk-patterns/SKILL.md) - AI SDK tool patterns
- [`.claude/rules/code-patterns.md`](../../.claude/rules/code-patterns.md) - Universal code patterns
- [`.claude/skills/documentation`](../../.claude/skills/documentation/SKILL.md) - Documentation standards

## Support

- **Package Issues**: Create issue in [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **API Issues**: Check [README.md](./README.md) for usage examples and [You.com Platform](https://you.com/platform) for API keys
- **Performance Issues**: See [PERFORMANCE.md](../../docs/PERFORMANCE.md)
- **Email**: support@you.com
