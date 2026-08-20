# LangChain.js Tools for You.com

Give your LangChain agents **real-time access to the web** through the hosted You.com MCP server. This package exposes an async `createYouClient()` helper that connects to `https://api.you.com/mcp` via `@langchain/mcp-adapters` and returns the underlying LangChain MCP client.

By default, `await client.getTools()` resolves to the default hosted tool set: `you-search`, `you-contents`, `you-research`, `you-balance`, `you-discover`, and `you-answer`. To use `you-finance`, request it explicitly in the `tools` parameter.

## Features

Build LangChain agents that can:
- **Search the web in real-time** - Access current information with advanced filtering (dates, sites, file types)
- **Research** - Comprehensive answers with cited sources, configurable effort (lite to exhaustive)
- **Extract any webpage** - Pull full content in markdown or HTML format
- **Zero configuration** - Works with any LangChain-compatible model provider (Anthropic, OpenAI, Google, Fireworks and more)
- **Hosted MCP transport** - Connects directly to the You.com hosted MCP server
- **Type-safe** - Full TypeScript support for async tool initialization
- **Production-ready** - Built on You.com's enterprise APIs

## Build your first LangChain agent in a few seconds

Use the [ydc-langchain-integration](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/ydc-langchain-integration) skill to quickly integrate You.com tools with your LangChain.js application. This is the easiest and fastest way to get started. Install the skill and run it with your favorite coding agent.

```bash
npx skills add youdotcom-oss/agent-skills --skill ydc-langchain-integration
```

Once installed, run the skill directly or ask your AI agent: **"Integrate LangChain.js with You.com tools"**

## Build your first LangChain agent manually instead

Get up and running in 4 quick steps:

### 1. Get your API key

Visit [you.com/platform/api-keys](https://you.com/platform/api-keys) to get your You.com API key. Keep this key secure - you'll need it for configuration.

### 2. Install the package

Choose your package manager:

```bash
# NPM
npm install @youdotcom-oss/langchain langchain

# Bun
bun add @youdotcom-oss/langchain langchain

# Yarn
yarn add @youdotcom-oss/langchain langchain
```

### 3. Add tools to your agent

Import `createYouClient()`, await the MCP-backed client, then resolve tools from that client for your LangChain agent:

```typescript
import { createAgent, initChatModel } from 'langchain';
import * as z from 'zod';
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient({
  apiKey: process.env.YDC_API_KEY,
});
const tools = await client.getTools();

// Create a chat model
const model = await initChatModel('claude-haiku-4-5', {
  temperature: 0,
});

// Define the agent's behavior
const systemPrompt = `You are a helpful research assistant.
Be concise and informative. Always cite your sources.`;

// Structured response format using Zod schema
const responseFormat = z.object({
  summary: z.string().describe('A concise summary of the findings'),
  key_points: z.array(z.string()).describe('Key points from the results'),
  urls: z.array(z.string()).describe('Source URLs'),
});

// Create an agent with all three tools — it picks the right one automatically
const agent = createAgent({
  model,
  tools,
  systemPrompt,
  responseFormat,
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What are the latest developments in AI?' }],
});

console.log(result.structuredResponse);
```

`createYouClient()` returns the underlying MCP client. Call `await client.getTools()` to resolve the default hosted tool set (`you-search`, `you-contents`, `you-research`, `you-balance`, `you-discover`, and `you-answer`) unless you scope it with `tools`, and call `await client.close()` when finished.

Set your You.com API key as an environment variable:

```bash
export YDC_API_KEY=your-api-key-here
```

Set your model provider credentials separately for whichever provider you use.

### 4. Test your setup

Ask your agent something that needs real-time information:

- "What are the latest developments in quantum computing?"
- "Research the pros and cons of WebAssembly vs JavaScript"
- "Extract and analyze the content from [https://anthropic.com](https://anthropic.com)"
- "Compare the free cash flow of Apple, Microsoft, and Alphabet"

Your agent will automatically choose the right tool and return up-to-date, accurate answers.

## What you can build

Your LangChain agents can now handle requests like these:

### Research & information

**Current events:**
- "What's trending in AI research this week?"
- "Find the latest news about climate policy from the past month"

**Technical documentation:**
- "Search for TypeScript best practices on the official docs"
- "Find examples of using WebAssembly in production"

### Content analysis & extraction

**Documentation analysis:**
- "Extract and summarize the main points from [https://docs.example.com](https://docs.example.com)"
- "Get the pricing information from [https://competitor.com/pricing](https://competitor.com/pricing)"

**Multi-page research:**
- "Extract content from these 3 blog posts and compare their approaches"
- "Pull the documentation from these URLs and create a summary"

## Configuration

The tools work out of the box with environment variables:

```bash
export YDC_API_KEY=your-api-key-here
```

<details>
<summary>Advanced configuration options</summary>

### Passing configuration directly

You can override the API key, request a specific hosted MCP profile, or scope the request to specific tool ids:

```typescript
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient({
  apiKey: 'your-api-key-here',
  tools: ['you-search', 'you-contents'],
});

const tools = await client.getTools();
```

`you-finance` is not included in the default tool set. Request it explicitly with `tools`.

Lead with the smallest explicit form when you only want finance:

```typescript
const client = await createYouClient({
  tools: 'you-finance',
});

const financeTools = await client.getTools();
```

If you want the default tools plus finance, request all of them explicitly:

```typescript
const client = await createYouClient({
  tools: ['you-search', 'you-contents', 'you-research', 'you-balance', 'you-discover', 'you-finance'],
});

const tools = await client.getTools();
```

Use `profile` when you want the hosted server to resolve tools through a named profile instead:

```typescript
const client = await createYouClient({
  profile: 'free',
});

const tools = await client.getTools();
```

### Configuration type

```typescript
export type YouClientConfig = {
  apiKey?: string;           // Defaults to YDC_API_KEY
  tools?: string | string[]; // Added as ?tools=...
  profile?: string;          // Added as ?profile=...
};
```

### Tool selection

The package always connects to `https://api.you.com/mcp`.

The default hosted tool set is:

- `you-search`
- `you-contents`
- `you-research`
- `you-balance`
- `you-discover`
- `you-answer`

Optional tools:

- `you-finance`

`you-finance` is not included in the default tool set. Request it explicitly with `tools`.

`tools` scopes the visible tool set.

`profile` selects a hosted server profile. `tools` scopes which tools are visible. If `profile` is provided, it takes precedence over `tools`.

Today, `profile: 'free'` is a search-only mode. It overrides `tools` and does not expose `you-contents`, `you-research`, `you-finance`, `you-balance`, `you-discover`, `you-answer`, or livecrawl.

### Using different model providers

These tools work with any LangChain-compatible model via `initChatModel`:

```typescript
import { createAgent, initChatModel } from 'langchain';
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient();
const tools = await client.getTools();

// Anthropic
const agent = createAgent({
  model: await initChatModel('claude-haiku-4-5'),
  tools,
});

// OpenAI
const agent = createAgent({
  model: await initChatModel('gpt-5-nano'),
  tools,
});
```

### Direct tool usage

You can also await the tool list and invoke a specific tool directly:

```typescript
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient({
  tools: 'you-search',
});
const tools = await client.getTools();
const searchTool = tools.find((tool) => tool.name === 'you-search');
const result = await searchTool?.invoke({ query: 'AI news', count: 5 });
console.log(result);
```

</details>

## Available tools

Default tools:

- `you-search`
- `you-contents`
- `you-research`
- `you-balance`
- `you-discover`
- `you-answer`

Optional tools:

- `you-finance`

---

**Note**: Your LangChain agent automatically selects the right tool based on the user's request. Tool metadata and schemas come from the hosted MCP server at runtime.

## Troubleshooting

### Problem: "YDC_API_KEY is required" error

**Solution**: Set your API key as an environment variable:

```bash
export YDC_API_KEY=your-api-key-here
```

Or pass it directly when creating tools:

```typescript
const client = await createYouClient({ apiKey: 'your-api-key-here' });
const tools = await client.getTools();
```

### Problem: Agent isn't using the tools

**Solution**: Make sure you're using `createAgent` from `langchain`, which automatically handles tool calling:

```typescript
import { createAgent, initChatModel } from 'langchain';
import { createYouClient } from '@youdotcom-oss/langchain';

const client = await createYouClient();
const tools = await client.getTools();

const agent = createAgent({
  model: await initChatModel('claude-haiku-4-5'),
  tools,
  systemPrompt: 'You are a helpful assistant.',
});
```

### Problem: Getting 401 authentication errors

**Solution**: Verify your API key is correct and properly set:

```bash
echo $YDC_API_KEY
```

Get a new API key at [you.com/platform/api-keys](https://you.com/platform/api-keys) if needed.

### Problem: Getting rate limit errors (429)

**Solution**: You've hit the API rate limit. Wait a few minutes before retrying, or check your API usage at [you.com/platform/api-keys](https://you.com/platform/api-keys).

### Need more help?

- **GitHub Issues**: [Report bugs](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email Support**: [support@you.com](mailto:support@you.com)

## For contributors

Interested in contributing? We'd love your help!

**Development setup**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions.

**Quick contribution steps:**
1. Fork the repository
2. Create a feature branch following [CONTRIBUTING.md](../../CONTRIBUTING.md) conventions
3. Follow code style guidelines (Biome enforced)
4. Write tests for your changes
5. Run quality checks: `bun run check && bun test`
6. Submit a pull request with a clear description

---

**License**: MIT - see [LICENSE](../../LICENSE) for details

**Author**: You.com ([https://you.com](https://you.com))
