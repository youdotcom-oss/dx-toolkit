---
name: ai-sdk-plugin-patterns
description: AI SDK plugin patterns - tool configuration, schema validation, API integration. Uses @youdotcom-oss/api utilities.
license: MIT
compatibility: Bun >= 1.2.21, AI SDK >= 5.0.0
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [ai-sdk, vercel, tool-development, api-integration]
---

# AI SDK Plugin Patterns

AI SDK plugin patterns using You.com API utilities from `@youdotcom-oss/api` package.

> **For end users**: See [packages/ai-sdk-plugin/README.md](../../packages/ai-sdk-plugin/README.md)  
> **For universal patterns**: See [`.agents/rules/core.md`](../../.agents/rules/core.md)

## When to Use

- Contributing to `@youdotcom-oss/ai-sdk-plugin` package
- Implementing AI SDK tools
- Debugging AI SDK integration

## Architecture

**AI SDK wraps API utilities as native tools:**
```
@youdotcom-oss/api (Foundation)
├── fetchSearchResults()
├── SearchQuerySchema
└── formatSearchResults()
         ↓
@youdotcom-oss/ai-sdk-plugin (AI SDK Wrapper)
└── youSearch() - Wraps API utility as AI SDK tool
```

## Tech Stack

- **AI SDK**: Vercel AI SDK ^6.0.0
- **API Utilities**: @youdotcom-oss/api ^0.1.0
- **Testing**: Bun test

## Quick Start

```bash
cd packages/ai-sdk-plugin
bun test
bun run check
```

## AI SDK-Specific Patterns

### Tool Function Pattern

**Each tool wraps API utility:**

```typescript
export const youSearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description: 'Search the web for current information...',
    inputSchema: SearchQuerySchema,  // From API package
    execute: async (params) => {
      if (!apiKey) throw new Error('YDC_API_KEY required');
      
      const response = await fetchSearchResults({ params, YDC_API_KEY: apiKey, getUserAgent });
      
      return {
        text: formatSearchResults(response),  // For AI model
        data: response                         // For inspection
      };
    },
  });
};
```

*Verify:* Each tool imports from `@youdotcom-oss/api`  
*Fix:* Use API package utilities, don't duplicate logic

### Tool Descriptions for AI Models

**Write for AI decision-making, not humans:**

```typescript
// ✅ Clear, actionable, includes use cases
description: 'Search the web for current information. Use for news, facts, weather, recent events, or any query requiring up-to-date data from the internet.'

// ❌ Too technical
description: 'Executes HTTP GET request to You.com Search API'

// ❌ Too generic
description: 'Web search tool'
```

*Verify:* Descriptions mention use cases  
*Fix:* Add when/why to use the tool

### API Key Handling

**Validate before API calls:**

```typescript
// ✅ Check API key in execute
execute: async (params) => {
  if (!apiKey) {
    throw new Error('YDC_API_KEY is required');
  }
  const response = await fetchSearchResults(...);
}

// ❌ Don't skip validation
execute: async (params) => {
  const response = await fetchSearchResults(...);  // May fail unclearly
}
```

*Verify:* All tools check `apiKey` before calls  
*Fix:* Add API key validation

### Response Format

**Always return `text` and `data`:**

```typescript
// ✅ Both formats
return {
  text: formatSearchResults(response),  // Human-readable
  data: response                         // Structured
};

// ❌ Only text
return formatSearchResults(response);

// ❌ Only data
return response;
```

*Verify:* All tools return `{ text, data }`  
*Fix:* Add both return formats

### Schema Import from API Package

**Import schemas, don't duplicate:**

```typescript
// ✅ Import from API package
import { SearchQuerySchema, fetchSearchResults, formatSearchResults } from '@youdotcom-oss/api';

export const youSearch = (config: YouToolsConfig = {}) => {
  return tool({
    inputSchema: SearchQuerySchema,  // Reuse
    execute: async (params) => { /* ... */ }
  });
};

// ❌ Don't redefine schemas
const SearchQuerySchema = z.object({ /* ... */ });  // Wrong
```

*Verify:* No `z.object` definitions in tool files  
*Fix:* Import from `@youdotcom-oss/api`

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

## Troubleshooting

**Missing API key:**
```bash
echo "export YDC_API_KEY=your-key" > .env
source .env
```

**Type errors with tool.execute():**
```typescript
// ✅ Provide toolCallId and messages
await tool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] });

// ❌ Missing second parameter
await tool.execute?.({ query: 'test' });
```

**Test failures with 429:**  
Wait before re-running, tests use `retry: 2`

## Publishing

See [root AGENTS.md](../../AGENTS.md#publishing)

Workflow: `.github/workflows/publish-ai-sdk-plugin.yml`

## Related Skills

- [`.claude/skills/api-patterns`](../api-patterns/SKILL.md) - Foundation API utilities
- [`.agents/rules/core.md`](../../.agents/rules/core.md) - Code patterns
- [`.agents/rules/testing.md`](../../.agents/rules/testing.md) - Test patterns

## Contributing

Package scope: `ai-sdk-plugin` in commits

```bash
feat(ai-sdk-plugin): add image search
fix(ai-sdk-plugin): handle empty results
```
