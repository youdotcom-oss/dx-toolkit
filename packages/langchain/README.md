# LangChain.js Tools for You.com

Give your LangChain agents **real-time access to the web** through the hosted You.com MCP server. This package exposes an async `youTools()` helper that connects to `https://api.you.com/mcp` via `@langchain/mcp-adapters` and returns LangChain-compatible tools for search, research, and content extraction.

## Features

Build LangChain agents that can:
- **Search the web in real-time** - Access current information with advanced filtering (dates, sites, file types)
- **Research** - Comprehensive answers with cited sources, configurable effort (lite to exhaustive)
- **Extract any webpage** - Pull full content in markdown or HTML format
- **Zero configuration** - Works with any LangChain-compatible model (Anthropic, OpenAI, Google, and more)
- **Hosted MCP transport** - Connects directly to the You.com hosted MCP server
- **Type-safe** - Full TypeScript support for async tool initialization
- **Production-ready** - Built on You.com's enterprise search API

## AI Agent Skills

**For LangChain.js Integration**: Use the [ydc-langchain-integration](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/ydc-langchain-integration) skill to quickly integrate You.com tools with your LangChain.js applications.

```bash
# Install the LangChain.js integration skill
npx skills add youdotcom-oss/agent-skills --skill ydc-langchain-integration
```

Once installed, ask your AI agent: **"Integrate LangChain.js with You.com tools"**

## Getting started

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

Import `youTools()`, await the MCP-backed tool list, and pass those tools into your LangChain agent:

```typescript
import { createAgent, initChatModel } from 'langchain';
import * as z from 'zod';
import { youTools } from '@youdotcom-oss/langchain';

const tools = await youTools({
  apiKey: process.env.YDC_API_KEY,
});

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

Set your You.com API key as an environment variable:

```bash
export YDC_API_KEY=your-api-key-here
```

Set your model provider credentials separately for whichever provider you use.

### 4. Test your setup

Ask your agent something that needs real-time information:

- "What are the latest developments in quantum computing?"
- "Research the pros and cons of WebAssembly vs JavaScript"
- "Extract and analyze the content from https://anthropic.com"

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
- "Extract and summarize the main points from https://docs.example.com"
- "Get the pricing information from https://competitor.com/pricing"

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
import { youTools } from '@youdotcom-oss/langchain';

const tools = await youTools({
  apiKey: 'your-api-key-here',
  tools: ['you-search', 'you-contents'],
});
```

Use `profile` when you want the hosted server to resolve tools through a named profile instead:

```typescript
const tools = await youTools({
  profile: 'free',
});
```

### Configuration type

```typescript
export type YouToolsConfig = {
  apiKey?: string;           // Defaults to YDC_API_KEY
  tools?: string | string[]; // Added as ?tools=...
  profile?: string;          // Added as ?profile=...
};
```

The package always connects to `https://api.you.com/mcp`. If `profile` is provided, it is sent instead of `tools`.

### Using different model providers

These tools work with any LangChain-compatible model via `initChatModel`:

```typescript
import { createAgent, initChatModel } from 'langchain';
import { youTools } from '@youdotcom-oss/langchain';

// Anthropic Claude
const agent = createAgent({
  model: await initChatModel('claude-haiku-4-5'),
  tools: await youTools(),
  systemPrompt: 'You are a helpful assistant.',
});

// OpenAI
const agent = createAgent({
  model: await initChatModel('gpt-4'),
  tools: await youTools({
    tools: 'you-search',
  }),
  systemPrompt: 'You are a helpful assistant.',
});
```

### Direct tool usage

You can also await the tool list and invoke a specific tool directly:

```typescript
import { youTools } from '@youdotcom-oss/langchain';

const tools = await youTools({
  tools: 'you-search',
});
const searchTool = tools.find((tool) => tool.name === 'you-search');
const result = await searchTool?.invoke({ query: 'AI news', count: 5 });
console.log(result);
```

</details>

## Available tools

This package returns the hosted MCP tool list, including:

- `you-search`
- `you-research`
- `you-contents`

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
const tools = await youTools({ apiKey: 'your-api-key-here' });
```

### Problem: Agent isn't using the tools

**Solution**: Make sure you're using `createAgent` from `langchain`, which automatically handles tool calling:

```typescript
import { createAgent, initChatModel } from 'langchain';
import { youTools } from '@youdotcom-oss/langchain';

const agent = createAgent({
  model: await initChatModel('claude-haiku-4-5'),
  tools: await youTools(),
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
- **Email Support**: support@you.com

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

**Author**: You.com (https://you.com)
