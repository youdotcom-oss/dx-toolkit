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

`you.call()` passes structured input to the remote MCP tool and returns its
structured output. It throws if the tool returns an error (`isError`) or omits
structured content, so a resolved value is always the tool's structured result.

Known hosted tools also have generated TypeScript types:

```typescript
import type { YouSearchInput, YouSearchOutput } from '@youdotcom-oss/api'

const input: YouSearchInput = {
  query: 'latest AI research',
}

const output = await you.call('you-search', input)
// output is typed as YouSearchOutput
```

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

The package ships generated type snapshots for the default hosted tools and still exposes live schema discovery from the hosted MCP server.

## Tool selection and profiles

`@youdotcom-oss/api` is a thin emitter: it puts the values you provide onto the
request and the **hosted You.com MCP server** decides which tools are
actually enabled. It does not try to reproduce those rules on the client, so
the server's behavior is always the source of truth.

The server resolves the enabled tool set in this order (per request):

1. **`profile`** sets the hard ceiling of available tools for the customer.
   No profile (or an unknown one) means unrestricted — the ceiling is every
   tool.
2. **`X-Allowed-Tools`** header, then the **`tools`** query parameter, then
   the server's default set selects which tools the caller wants.
3. The final enabled set is the **intersection** of the profile ceiling and
   the resolved allowed-tools. Unknown tool names are silently ignored.
4. The `free` profile (`profile=free`) **bypasses auth entirely** on the
   server side, so an `Authorization` header is never inspected for it.

### Scoping tools

Pass `allowedTools` to send the `tools` query parameter:

```typescript
const you = await createYouApi({
  allowedTools: ['you-search', 'you-research'],
  apiKey: process.env.YDC_API_KEY,
})
```

This connects to `https://api.you.com/mcp?tools=you-search,you-research`.

You can also set `YDC_ALLOWED_TOOLS` when `allowedTools` is not provided:

```bash
export YDC_ALLOWED_TOOLS="you-search,you-research,you-contents"
```

Explicit `allowedTools` takes precedence over `YDC_ALLOWED_TOOLS`.

### Profiles and auth

Set `profile` to route to a hosted profile (sent as `?profile=...`):

```typescript
const you = await createYouApi({
  profile: 'free',
})
```

`profile` and `allowedTools` are independent and may be combined — both are
emitted and the server intersects them. The client does not drop one for the
other.

Auth is transparent: **if an API key is available, the client sends
`Authorization: Bearer ...`** — including alongside `profile: 'free'`. The
`free` profile ignores that header on the server side, so passing a key with
it is harmless but unnecessary.

## Environment

- `YDC_API_KEY`
  Optional default API key. When set, requests include
  `Authorization: Bearer ...`. Sent unconditionally when a key is available,
  including with `profile: 'free'`.
- `YDC_ALLOWED_TOOLS`
  Optional comma-separated hosted tool ids. Consulted whenever `allowedTools`
  is not provided, independent of whether an API key is configured.

## Related packages

- `@youdotcom-oss/cli`
  Agent-first CLI for calling the same hosted MCP tools from a terminal.
- `@youdotcom-oss/mcp`
  STDIO bridge for MCP clients that need a local MCP server command.
- `@youdotcom-oss/ai-sdk-plugin`
  Vercel AI SDK integration for the hosted MCP server.
- `@youdotcom-oss/langchain`
  LangChain.js integration for the hosted MCP server.
