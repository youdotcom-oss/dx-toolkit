---
name: langchain-patterns
description: LangChain tool patterns - DynamicStructuredTool wrapping, JSON string returns, config merging. Uses @youdotcom-oss/api utilities.
license: MIT
compatibility: Bun >= 1.2.21, LangChain >= 1.0.0
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [langchain, langchain-tools, tool-development, api-integration]
---

# LangChain Patterns

LangChain tool patterns using You.com API utilities from `@youdotcom-oss/api` package.

> **For end users**: See [packages/langchain/README.md](../../packages/langchain/README.md)  
> **For universal patterns**: See [`.agents/rules/core.md`](../../.agents/rules/core.md)

## When to Use

- Contributing to `@youdotcom-oss/langchain` package
- Implementing LangChain tools
- Debugging LangChain integration

## Architecture

**LangChain wraps API utilities as DynamicStructuredTool instances:**
```
@youdotcom-oss/api (Foundation)
├── fetchSearchResults()
├── SearchQuerySchema
├── fetchContents()
└── ContentsQuerySchema
         ↓
@youdotcom-oss/langchain (LangChain Wrapper)
├── youSearch() - Wraps API utility as DynamicStructuredTool
└── youContents() - Wraps API utility as DynamicStructuredTool
```

## Tech Stack

- **LangChain**: LangChain.js >= 1.0.0 (peer dependency)
- **Tools**: `DynamicStructuredTool` from `@langchain/core/tools`
- **API Utilities**: @youdotcom-oss/api 0.3.4
- **Testing**: Bun test

## Quick Start

```bash
cd packages/langchain
bun test
bun run check
```

## LangChain-Specific Patterns

### DynamicStructuredTool Pattern

**Each tool creates a DynamicStructuredTool instance:**

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools'
import { type GetUserAgent, SearchQuerySchema, fetchSearchResults } from '@youdotcom-oss/api'
import packageJson from '../package.json' with { type: 'json' }

const getUserAgent: GetUserAgent = () => `LangChain-Plugin/${packageJson.version}(You.com)`

export const youSearch = (config: YouSearchConfig = {}) => {
  const { apiKey: configApiKey, ...defaults } = config
  const apiKey = configApiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_search',
    description: 'Search the web for current information...',
    schema: SearchQuerySchema,  // From API package
    func: async (params) => {
      const response = await fetchSearchResults({
        searchQuery: { ...defaults, ...params },
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return JSON.stringify(response)
    },
  })
}
```

*Verify:* Each tool uses `new DynamicStructuredTool()` with `name`, `description`, `schema`, `func`
*Fix:* Follow the pattern above, import `DynamicStructuredTool` from `@langchain/core/tools`

### JSON String Return Format

**LangChain tools return JSON strings (not objects, not formatted text):**

```typescript
// ✅ JSON string - LangChain convention
func: async (params) => {
  const response = await fetchSearchResults(...)
  return JSON.stringify(response)
}

// ❌ Object return - not compatible with LangChain tool interface
func: async (params) => {
  return { text: formatted, data: response }
}

// ❌ Formatted text - loses structured data
func: async (params) => {
  return formatSearchResults(response)
}
```

*Verify:* All tools return `JSON.stringify(response)`
*Fix:* Wrap API response in `JSON.stringify()`

### Config Merging

**Destructure apiKey, spread defaults, merge at call time:**

```typescript
export type YouSearchConfig = YouToolsConfig & Partial<SearchQuery>

export const youSearch = (config: YouSearchConfig = {}) => {
  // 1. Separate apiKey from query defaults
  const { apiKey: configApiKey, ...defaults } = config
  const apiKey = configApiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    // 2. Merge defaults with invoke-time params (params win)
    func: async (params) => {
      const response = await fetchSearchResults({
        searchQuery: { ...defaults, ...params },
        YDC_API_KEY: apiKey,
        getUserAgent,
      })
      return JSON.stringify(response)
    },
  })
}
```

*Verify:* Config types extend `YouToolsConfig & Partial<QueryType>`
*Fix:* Destructure `{ apiKey, ...defaults }`, merge as `{ ...defaults, ...params }`

### Schema Import from API Package

**Import schemas, don't duplicate:**

```typescript
// ✅ Import from API package
import {
  SearchQuerySchema,
  ContentsQuerySchema,
  fetchSearchResults,
  fetchContents,
} from '@youdotcom-oss/api'

return new DynamicStructuredTool({
  schema: SearchQuerySchema,  // Reuse
  func: async (params) => { /* ... */ }
})

// ❌ Don't redefine schemas
const SearchQuerySchema = z.object({ /* ... */ })  // Wrong
```

*Verify:* No `z.object` definitions in tool files
*Fix:* Import from `@youdotcom-oss/api`

### Tool Descriptions for AI Models

**Write for AI decision-making, not humans:**

```typescript
// ✅ Clear, actionable, includes use cases
description: 'Search the web for current information, news, articles, and content using You.com. Returns web results with snippets and news articles. Use this when you need up-to-date information or facts from the internet.'

// ❌ Too technical
description: 'Executes HTTP GET request to You.com Search API'

// ❌ Too generic
description: 'Web search tool'
```

*Verify:* Descriptions mention use cases
*Fix:* Add when/why to use the tool

## Available Tools

| Tool | API Utility | Schema |
|------|-------------|--------|
| `youSearch()` | `fetchSearchResults()` | `SearchQuerySchema` |
| `youContents()` | `fetchContents()` | `ContentsQuerySchema` |

## Testing

```bash
bun test                              # All tests
bun test src/tests/integration.spec.ts  # Integration tests
```

**Prerequisites**: `YDC_API_KEY` and `ANTHROPIC_API_KEY` in `.env`

**Test structure**:
- Error handling tests (invalid API key)
- Smoke tests (tool invocation, JSON parsing, result validation)
- LangChain agent integration (single tool, multiple tools with `createAgent`)

## Troubleshooting

**Missing API key:**
```bash
echo "export YDC_API_KEY=your-key" > .env
source .env
```

**Test failures with 429:**
Wait before re-running, tests use `retry: 2`

**LangChain agent timeout:**
Agent tests have long timeouts (120-180s). If they fail intermittently, retry.

## Publishing

See [root AGENTS.md](../../AGENTS.md#publishing)

Workflow: `.github/workflows/publish-langchain.yml`

## Related Skills

- [`.claude/skills/api-patterns`](../api-patterns/SKILL.md) - Foundation API utilities
- [`.agents/rules/core.md`](../../.agents/rules/core.md) - Code patterns
- [`.agents/rules/testing.md`](../../.agents/rules/testing.md) - Test patterns

## Contributing

Package scope: `langchain` in commits

```bash
feat(langchain): add image search tool
fix(langchain): handle empty results
```
