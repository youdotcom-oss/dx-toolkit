# You.com for AI agents

Add real-time web search, research, and content extraction to any agent. Hosted MCP server, free tier with no API key, plus first-party plugins for the Vercel AI SDK and LangChain.

```jsonc
// Add this to your MCP client config (Claude Desktop, Cursor, Windsurf, etc.)
// Free tier — no API key, no signup.
{
  "mcpServers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_PROFILE": "free" }
    }
  }
}
```

If your client supports remote MCP, point it at `https://api.you.com/mcp?profile=free` directly — no local process needed.

## Why You.com

- **Real web index** — backed by You.com's production search infrastructure, not a scraper.
- **Free tier, no signup** — `?profile=free` exposes `you-search` to any MCP client with zero auth.
- **Listed in the official MCP registry** as [`io.github.youdotcom-oss/mcp`](https://registry.modelcontextprotocol.io/?q=io.github.youdotcom-oss%2Fmcp).
- **Works with every major agent stack** — Claude, Cursor, Windsurf, VS Code, Vercel AI SDK, LangChain.
- **One hosted endpoint** — all packages here are thin clients over `https://api.you.com/mcp`.

## Quick start

Every snippet below works against the free tier. To unlock `you-research`, `you-contents`, and `you-finance`, drop the `YDC_PROFILE` line and set `YDC_API_KEY` to a key from [you.com/platform/api-keys](https://you.com/platform/api-keys).

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```jsonc
{
  "mcpServers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_PROFILE": "free" }
    }
  }
}
```

Authenticated (all default tools):

```jsonc
{
  "mcpServers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_API_KEY": "<your-key>" }
    }
  }
}
```

### Claude Code

```bash
# Free tier
claude mcp add you -e YDC_PROFILE=free -- npx @youdotcom-oss/mcp

# Authenticated
claude mcp add you -e YDC_API_KEY=<your-key> -- npx @youdotcom-oss/mcp
```

### Cursor

Add to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```jsonc
{
  "mcpServers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_PROFILE": "free" }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```jsonc
{
  "mcpServers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_PROFILE": "free" }
    }
  }
}
```

### VS Code

Add to your user or workspace `mcp.json`:

```jsonc
{
  "servers": {
    "you": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_PROFILE": "free" }
    }
  }
}
```

### Any MCP client (remote)

If your client speaks streamable HTTP, skip the local bridge:

```
https://api.you.com/mcp?profile=free
```

Authenticated:

```
https://api.you.com/mcp
Authorization: Bearer <your-key>
```

## Packages

| Package | What it does |
|---|---|
| [`@youdotcom-oss/mcp`](./packages/mcp/) | STDIO bridge to the hosted MCP server. Use this when your client needs a local command. |
| [`@youdotcom-oss/ai-sdk-plugin`](./packages/ai-sdk-plugin/) | Vercel AI SDK tools backed by the hosted MCP server. |
| [`@youdotcom-oss/langchain`](./packages/langchain/) | LangChain.js tools backed by the hosted MCP server. |
| [`@youdotcom-oss/cli`](./packages/cli/) | `ydc` CLI for listing tools, fetching schemas, and invoking remote tools from a shell. |

The free profile (`?profile=free`) exposes `you-search` only. The authenticated default exposes `you-search`, `you-research`, and `you-contents`. `you-finance` is available on request via `?tools=you-finance`.

## Use cases

### Web search inside Claude

Once `@youdotcom-oss/mcp` is wired into Claude Desktop (see above), ask Claude:

> Search the web for the latest releases of Bun and summarize the changes since 1.2.

Claude calls `you-search` directly. No code required.

### Vercel AI SDK agent grounded in real-time web

```ts
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';
import { createYouClient } from '@youdotcom-oss/ai-sdk-plugin';

const client = await createYouClient({ apiKey: process.env.YDC_API_KEY });
const tools = await client.tools();

const result = await generateText({
  model: createAnthropic()('claude-sonnet-4-5-20250929'),
  tools,
  stopWhen: stepCountIs(5),
  prompt: 'What shipped in the latest Bun release?',
});

console.log(result.text);
await client.close();
```

### LangChain agent with cited sources

```ts
import { createAgent, initChatModel } from 'langchain';
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient({ apiKey: process.env.YDC_API_KEY });
const tools = await client.getTools();

const agent = createAgent({
  model: await initChatModel('claude-haiku-4-5'),
  tools,
  systemPrompt: 'You are a research assistant. Always cite your sources.',
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Latest developments in quantum computing?' }],
});

console.log(result);
```

## Links

- API keys: [you.com/platform/api-keys](https://you.com/platform/api-keys)
- Platform docs: [documentation.you.com](https://documentation.you.com)
- MCP registry listing: [`io.github.youdotcom-oss/mcp`](https://github.com/modelcontextprotocol/registry)
- Issues: [github.com/youdotcom-oss/dx-toolkit/issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- Support: support@you.com

## Contributing

This is a Bun workspace monorepo. Development setup, workspace commands, and code conventions live in [AGENTS.md](./AGENTS.md); contribution flow and PR conventions live in [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs welcome.

## License

MIT — see [LICENSE](./LICENSE).
