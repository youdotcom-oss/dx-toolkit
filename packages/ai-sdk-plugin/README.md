# Vercel AI SDK Plugin for You.com

Give your AI applications **real-time access to the web** through the hosted You.com MCP server. This package exposes an async `youTools()` helper that connects to `https://api.you.com/mcp` and returns AI SDK-compatible tools for search, research, and content extraction.

## Features

Build AI applications that can:
- **Search the web in real-time** - Access current information with advanced filtering (dates, sites, file types)
- **Research** - Comprehensive answers with cited sources, configurable effort (lite to exhaustive)
- **Extract any webpage** - Pull full content in markdown or HTML format
- **Zero configuration** - Works with any AI SDK model provider (Anthropic, OpenAI, Google, and more)
- **Hosted MCP transport** - Connects directly to the You.com hosted MCP server
- **Type-safe** - Full TypeScript support for async tool initialization
- **Production-ready** - Built on You.com's enterprise search API

## AI Agent Skills

**For AI SDK Integration**: Use the [ydc-ai-sdk-integration](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/ydc-ai-sdk-integration) skill to quickly integrate You.com tools with your Vercel AI SDK applications.

```bash
# Install the AI SDK integration skill
npx skills add youdotcom-oss/agent-skills --skill ydc-ai-sdk-integration
```

Once installed, ask your AI agent: **"Integrate Vercel AI SDK with You.com tools"**

**Supported AI agents**: Claude Code, Cursor, Windsurf, Cody, Continue, and more.

See [Skill Documentation](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/ydc-ai-sdk-integration) for complete integration guide.

## Getting started

Get up and running in 4 quick steps:

### 1. Get your API key

Visit [you.com/platform/api-keys](https://you.com/platform/api-keys) to get your You.com API key. Keep this key secure - you'll need it for configuration.

### 2. Install the package (NPM, Bun, or Yarn)

Choose your package manager:

```bash
# NPM
npm install @youdotcom-oss/ai-sdk-plugin ai

# Bun
bun add @youdotcom-oss/ai-sdk-plugin ai

# Yarn
yarn add @youdotcom-oss/ai-sdk-plugin ai
```

### 3. Add tools to your application

Import `youTools()`, await the MCP-backed tool set, and pass the returned tools into your AI SDK call:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';
import { youTools } from '@youdotcom-oss/ai-sdk-plugin';

// Create your AI model provider
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools = await youTools({
  apiKey: process.env.YDC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools,
  stopWhen: stepCountIs(5),  // Required for tool result processing
  prompt: 'Search for the latest developments in quantum computing',
});

console.log(result.text);
```

Set your You.com API key as an environment variable:

```bash
export YDC_API_KEY=your-api-key-here
```

Set your model provider credentials separately for whichever provider you use.

### 4. Test your setup

Ask your AI something that needs real-time information:

- "What are the latest developments in quantum computing?"
- "Find recent articles about sustainable energy and summarize the key trends"
- "Extract and analyze the content from https://anthropic.com"

Your AI will automatically choose the right tool and return up-to-date, accurate answers.

## What you can build

Your AI can now handle requests like these:

### Research & information

**Current events:**
- "What's trending in AI research this week?"
- "Find the latest news about climate policy from the past month"

**Comparative research:**
- "Compare the features of the top 3 CRM platforms"
- "What are developers saying about the new React version?"

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

### Real-time workflows

**Market intelligence:**
- "What's the current status of the stock market?"
- "Find recent funding announcements in the AI space"

**Competitive analysis:**
- "Search for recent product launches by our competitors"
- "Extract feature comparisons from competitor websites"

## Configuration

The plugin works out of the box with environment variables:

```bash
export YDC_API_KEY=your-api-key-here
```

<details>
<summary>Advanced configuration options</summary>

### Passing configuration directly

You can override the API key, request a specific hosted MCP profile, or scope the request to specific tool ids:

```typescript
import { youTools } from '@youdotcom-oss/ai-sdk-plugin';

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

This plugin works with any AI SDK compatible model provider:

```typescript
import { generateText, stepCountIs } from 'ai';

// Anthropic Claude
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: await youTools(),
  stopWhen: stepCountIs(3),
  prompt: 'Search for AI news',
});

// OpenAI
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const result = await generateText({
  model: openai('gpt-4'),
  tools: await youTools({
    tools: 'you-search',
  }),
  stopWhen: stepCountIs(3),
  prompt: 'Search for AI news',
});

// Google Gemini
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  tools: await youTools({
    tools: 'you-search',
  }),
  stopWhen: stepCountIs(3),
  prompt: 'Search for AI news',
});
```

</details>

## Available tools

This package returns the hosted MCP tool set, including:

- `you-search`
- `you-research`
- `you-contents`

---

**Note**: Your AI automatically selects the right tool based on the user's request. Use `stopWhen: stepCountIs(n)` to enable multi-step tool execution, and your AI handles the orchestration.

## Examples

The `examples/` directory contains complete working examples demonstrating all features:

- **basic-search.ts** - Web search with filters and parameters
- **streaming-text.ts** - Real-time streaming responses
- **agent-response.ts** - AI reasoning with web context
- **content-extraction.ts** - Extract and analyze webpages
- **error-handling.ts** - Production-ready error handling

**Quick start:**

1. Set up your environment variables (see [examples/README.md](./examples/README.md) for 3 setup options)
2. Run an example:

```bash
# Using the example script (easiest)
bun run example              # Runs basic-search (default)
bun run example agent        # Runs agent-response
bun run example help         # Shows all available examples

# Or run directly
cd packages/ai-sdk-plugin
bun examples/basic-search.ts
```

All examples include:
- Environment variable validation with helpful error messages
- Explicit provider pattern matching integration tests
- Error handling best practices

**For complete setup instructions, environment variable options, and troubleshooting**, see [examples/README.md](./examples/README.md)

## Troubleshooting

### Problem: "YDC_API_KEY is required" error

**Solution**: Set your API key as an environment variable:

```bash
export YDC_API_KEY=your-api-key-here
# Then restart your application
```

Or pass it directly when creating tools:

```typescript
const tools = await youTools({ apiKey: 'your-api-key-here' });
```

### Problem: AI isn't using the tools

**Solution**: Make sure you're using `stopWhen` to enable multi-step tool execution:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: await youTools(),
  stopWhen: stepCountIs(3),  // Required: enables tool result processing
  prompt: 'Search for recent AI news',
});
```

### Problem: Tools execute but response is empty

**Symptoms**: You see tool calls in `result.steps` but `result.text` is empty or minimal.

**Solution**: Replace `maxSteps` with `stopWhen: stepCountIs(n)`:

```typescript
import { generateText, stepCountIs } from 'ai';

// ❌ WRONG - tools execute but results aren't integrated
const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: await youTools(),
  maxSteps: 5,  // Don't use this!
  prompt: 'Search for AI news',
});

// ✅ CORRECT - tool results properly integrated
const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: await youTools(),
  stopWhen: stepCountIs(3),  // Use this instead
  prompt: 'Search for AI news',
});
```

**Why this happens**: `maxSteps` doesn't properly integrate tool results into the response generation. The `stopWhen` pattern ensures the AI processes tool outputs before stopping.

### Problem: Getting 401 authentication errors

**Solution**: Verify your API key is correct and properly set:

```bash
# Check if environment variable is set
echo $YDC_API_KEY

# If empty, set it
export YDC_API_KEY=your-api-key-here
```

Get a new API key at [you.com/platform/api-keys](https://you.com/platform/api-keys) if needed.

### Problem: Getting rate limit errors (429)

**Solution**: You've hit the API rate limit. Wait a few minutes before retrying, or check your API usage at [you.com/platform/api-keys](https://you.com/platform/api-keys).

### Problem: Tool execution failing silently

**Solution**: Check the AI SDK's tool results for error details:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: await youTools(),
  prompt: 'Search for AI news',
});

// Inspect tool results for errors
console.log(result.toolResults);
```

### Need more help?

- **GitHub Issues**: [Report bugs](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email Support**: support@you.com

## For contributors

Interested in contributing? We'd love your help!

**Development setup**: See [AGENTS.md](./AGENTS.md) for complete development guide, architecture overview, code patterns, and testing guidelines.

**Quick contribution steps:**
1. Fork the repository
2. Create a feature branch following [CONTRIBUTING.md](../../CONTRIBUTING.md) conventions
3. Follow code style guidelines (Biome enforced)
4. Write tests for your changes
5. Run quality checks: `bun run check && bun test`
6. Submit a pull request with a clear description

We appreciate contributions of all kinds:
- Bug fixes and improvements
- New features and enhancements
- Documentation improvements
- Test coverage improvements
- Performance optimizations

---

**License**: MIT - see [LICENSE](../../LICENSE) for details

**Author**: You.com (https://you.com)
