# @youdotcom-oss/api

Minimal TypeScript wrapper for the hosted You.com MCP server.

This package is the programmatic companion to `@youdotcom-oss/cli`. The CLI now lives in its own package, and both packages use the same remote MCP surface instead of maintaining local per-endpoint REST clients.

## Install

```bash
bun add @youdotcom-oss/api
```

```bash
npm install @youdotcom-oss/api
```

## Quick start

```typescript
import { createYouApi } from '@youdotcom-oss/api'

const you = await createYouApi({
  apiKey: process.env.YDC_API_KEY,
})

try {
  const result = await you.call('you-search', {
    query: 'latest AI research',
  })

  console.log(result)
} finally {
  await you.close()
}
```

`you.call()` passes structured input to the remote MCP tool and returns the tool's structured output when available.

## Discover tools and schemas

```typescript
const you = await createYouApi()

try {
  const tools = await you.tools()
  const searchInputSchema = await you.schema('you-search')
  const searchOutputSchema = await you.schema('you-search', 'output')

  console.log(tools, searchInputSchema, searchOutputSchema)
} finally {
  await you.close()
}
```

The package does not ship local schemas. Schema discovery comes from the hosted MCP server, so newly exposed tools can be used without updating this package.

## Scope tools

Use `allowedTools` to scope the hosted MCP route:

```typescript
const you = await createYouApi({
  allowedTools: ['you-search', 'you-research'],
  apiKey: process.env.YDC_API_KEY,
})
```

This connects to `https://api.you.com/mcp?tools=you-search,you-research`.

You can also set `YDC_ALLOWED_TOOLS` when `YDC_API_KEY` is available:

```bash
export YDC_API_KEY="your-api-key"
export YDC_ALLOWED_TOOLS="you-search,you-research,you-contents"
```

Explicit `allowedTools` takes precedence over `YDC_ALLOWED_TOOLS`.

## Free search profile

For free search access, use the hosted free profile:

```typescript
const you = await createYouApi({
  profile: 'free',
})
```

Profile routing uses `https://api.you.com/mcp?profile=free` and omits the Authorization header.

## Environment

- `YDC_API_KEY`
  Optional default API key. When set, requests include `Authorization: Bearer ...` unless `profile: 'free'` is used.
- `YDC_ALLOWED_TOOLS`
  Optional comma-separated hosted tool ids. Used only when an API key is available and `allowedTools` is not provided.

## Related packages

- `@youdotcom-oss/cli`
  Agent-first CLI for calling the same hosted MCP tools from a terminal.
- `@youdotcom-oss/mcp`
  STDIO bridge for MCP clients that need a local MCP server command.
- `@youdotcom-oss/ai-sdk-plugin`
  Vercel AI SDK integration for the hosted MCP server.
- `@youdotcom-oss/langchain`
  LangChain.js integration for the hosted MCP server.
