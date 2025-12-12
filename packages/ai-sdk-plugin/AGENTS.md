# Vercel AI SDK Plugin for You.com - Development Guide

A Vercel AI SDK plugin providing You.com's search, AI agent, and content extraction capabilities as native AI SDK tools.

---

> **Note for end users**: If you want to use this plugin (not develop or contribute), see [README.md](./README.md) for setup instructions and usage examples.

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

### Setup Environment

```bash
cd packages/ai-sdk-plugin

# Install dependencies (from monorepo root)
cd ../..
bun install

# Set up API keys
echo "export YDC_API_KEY=your-youdotcom-api-key-here" > .env
echo "export ANTHROPIC_API_KEY=your-anthropic-api-key-here" >> .env
source .env
```

### Development Commands

```bash
# From package directory
cd packages/ai-sdk-plugin

bun test                       # Run all tests
bun test:coverage              # Run tests with coverage report
bun test:watch                 # Run tests in watch mode
bun run check                  # Run all checks (biome + types)
bun run check:write            # Auto-fix all issues
```

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
│       ├── integration.spec.ts      # End-to-end tool tests
│       └── processing-lag.spec.ts   # Performance overhead tests
├── examples/                        # Usage examples
├── docs/
│   └── API.md                       # API reference
├── package.json                     # Package configuration
└── README.md                        # User documentation
```

## AI SDK Tool Pattern

### Tool Function Structure

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

### Tool Configuration

**Always provide API key via config or environment**:

```typescript
// ✅ From environment variable
const search = youSearch();

// ✅ From config
const search = youSearch({ apiKey: process.env.YDC_API_KEY });

// ❌ Will fail at execution time
const search = youSearch({ apiKey: '' });
```

**Always validate API key before API calls**:

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
- `livecrawl` (string, optional) - Live-crawl sections for full content ("web", "news", "all")
- `livecrawl_formats` (string, optional) - Format for crawled content ("html", "markdown")
- Additional filters (see API.md)

**Returns**: Web results with snippets and news articles

**Example**:
```typescript
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'What happened in AI last week?',
});
```

### youExpress()

Fast AI agent with web search integration.

**File**: `src/main.ts:98-123`

**Schema**: Imported from `@youdotcom-oss/mcp` (`ExpressAgentInputSchema`)

**Parameters**:
- `input` (string) - Query or prompt
- `tools` (array, optional) - Enable web search (default: enabled)

**Returns**: AI-generated answer with optional web context

**Example**:
```typescript
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    agent: youExpress(),
  },
  prompt: 'What are the benefits of MCP?',
});
```

### youContents()

Web page content extraction in markdown or HTML format.

**File**: `src/main.ts:148-173`

**Schema**: Imported from `@youdotcom-oss/mcp` (`ContentsQuerySchema`)

**Parameters**:
- `urls` (array) - URLs to extract content from
- `format` (string, optional) - Output format ('markdown' or 'html')

**Returns**: Extracted page content

**Example**:
```typescript
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    extract: youContents(),
  },
  prompt: 'Extract and summarize vercel.com/ai',
});
```

## Development Workflow

### Adding New Features

**Pattern**: All new features must maintain minimal abstraction overhead.

**When adding tool parameters**:

1. **Update schema in @youdotcom-oss/mcp** - Schemas are maintained in the MCP package
2. **No changes needed in this package** - Tool automatically uses updated schema
3. **Add tests** - Test new parameters in integration.spec.ts
4. **Update API.md** - Document new parameters

**When adding new tools**:

1. **Create tool export in src/main.ts**:
```typescript
export const youNewTool = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description: 'Clear description for AI model',
    inputSchema: NewToolSchema, // From @youdotcom-oss/mcp
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required');
      }

      const response = await callNewToolUtility({
        params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      });

      return {
        text: formatNewToolResponse(response),
        data: response,
      };
    },
  });
};
```

2. **Add integration tests**
3. **Add example in examples/**
4. **Update README.md and API.md**
5. **Run performance tests** - Ensure overhead stays within thresholds

### Testing Strategy

**Integration Tests** (`src/tests/integration.spec.ts`):
- Test all three tools with real API calls
- Test error handling (missing API key, invalid key)
- Test tool composition (multiple tools together)
- Test with different AI models
- Test streaming responses

**Processing Lag Tests** (`src/tests/processing-lag.spec.ts`):
- Compare raw API calls vs tool abstraction overhead
- Measure absolute lag (< 80ms threshold)
- Measure relative overhead (< 35% threshold)
- Measure memory overhead (< 350KB threshold)
- See [PERFORMANCE.md](../../docs/PERFORMANCE.md) for methodology and threshold details

**Test Configuration**:

```typescript
// ✅ Always use retry for API tests
test('API test', async () => {
  // Test implementation
}, { timeout: 60_000, retry: 2 });

// ✅ Use numeric separators for large numbers
{ timeout: 60_000, retry: 2 }

// ❌ Don't omit retry
{ timeout: 60000 } // No retry, may fail on network issues
```

### Running Tests

```bash
# All tests
bun test

# Integration tests only
bun test src/tests/integration.spec.ts

# Processing lag tests only
bun test src/tests/processing-lag.spec.ts

# Coverage report
bun test:coverage

# Watch mode
bun test:watch
```

**Prerequisites**:
- `YDC_API_KEY` environment variable
- `ANTHROPIC_API_KEY` environment variable
- Stable network connection

## Code Quality

### Automated Checks

```bash
# Run all checks (CI command)
bun run check              # biome + types

# Individual checks
bun run check:biome        # Lint and format
bun run check:types        # TypeScript errors

# Auto-fix
bun run check:write        # Fix all auto-fixable issues
```

### AI SDK Tool Patterns

**Tool Description**: Write descriptions for the AI model, not for humans

```typescript
// ✅ Clear guidance for AI model
description: 'Search the web for current information, news, articles, and content using You.com. Returns web results with snippets and news articles. Use this when you need up-to-date information or facts from the internet.'

// ❌ Too brief
description: 'Search the web'

// ❌ For humans instead of AI
description: 'This tool allows you to search'
```

**Input Schema**: Always use schemas from `@youdotcom-oss/mcp`

```typescript
// ✅ Import from @youdotcom-oss/mcp
import { SearchQuerySchema } from '@youdotcom-oss/mcp';
inputSchema: SearchQuerySchema

// ❌ Don't duplicate schemas
const MySearchSchema = z.object({ query: z.string() });
inputSchema: MySearchSchema
```

**Error Handling**: Always validate API key before calls

```typescript
// ✅ Check API key
if (!apiKey) {
  throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.');
}

// ❌ Let API call fail
const response = await callApi(apiKey); // Unclear error if apiKey is ''
```

**Response Formatting**: Use formatters from `@youdotcom-oss/mcp`

```typescript
// ✅ Use provided formatters
import { formatSearchResults } from '@youdotcom-oss/mcp';
text: formatSearchResults(response)

// ❌ Create custom formatters
text: response.results.map(r => r.title).join('\n')
```

### Code Style

For universal code patterns (arrow functions, numeric separators, Bun APIs, etc.), see [root AGENTS.md](../../AGENTS.md#universal-code-patterns).

## Performance

### Processing Lag Thresholds

This plugin maintains strict performance thresholds (see [PERFORMANCE.md](../../docs/PERFORMANCE.md)):

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Processing lag** | < 80ms | SDK integration overhead (tool wrapper, validation, formatting) |
| **Overhead percentage** | < 35% | Acceptable for abstraction providing type safety and error handling |
| **Memory overhead** | < 350KB | Tool instances, schemas, and response transformation |

**Overhead sources**:
1. AI SDK `tool()` wrapper - Tool registration and execution context
2. Zod validation - Input schema validation
3. MCP utilities - API calls and response formatting
4. Response transformation - Converting to `{ text, data }` format
5. Error handling - API key validation and error messages

### Performance Testing

Run performance tests before committing:

```bash
bun test src/tests/processing-lag.spec.ts
```

**Monitor overhead when**:
- Adding new tool parameters
- Modifying response formatting
- Updating @youdotcom-oss/mcp dependency
- Adding validation logic

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

### Integration Test Failures

**Symptom**: Tests fail consistently despite valid API key

**Troubleshooting**:
```bash
# Check API key is valid
echo $YDC_API_KEY

# Check ANTHROPIC_API_KEY is set
echo $ANTHROPIC_API_KEY

# Test individual tool
bun test src/tests/integration.spec.ts -t "basic web search"

# Run with verbose output
bun test --verbose src/tests/integration.spec.ts
```

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

## Support

- **Package Issues**: Create issue in [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **API Issues**: Check [API.md](./docs/API.md) and [You.com Platform](https://you.com/platform)
- **Performance Issues**: See [PERFORMANCE.md](../../docs/PERFORMANCE.md)
- **Email**: support@you.com
