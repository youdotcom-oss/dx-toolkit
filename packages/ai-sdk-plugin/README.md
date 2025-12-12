# Vercel AI SDK Plugin for You.com

Give your AI applications **real-time access to the web** with native AI SDK tools. Search current content, get AI-generated answers with web context, and extract live web pages—all through simple function calls. Built for the [Vercel AI SDK](https://sdk.vercel.ai/), this plugin brings **You.com's search, AI agents, and content extraction directly into your AI applications** with zero server setup.

## Features

Build AI applications that can:
- **Search the web in real-time** - Access current information with advanced filtering (dates, sites, file types)
- **Generate answers with web context** - Fast AI responses enhanced with live web data
- **Extract any webpage** - Pull full content in markdown or HTML format
- **Zero configuration** - Works with any AI SDK model provider (Anthropic, OpenAI, Google, and more)
- **Type-safe** - Full TypeScript support with Zod schema validation
- **Production-ready** - Built on You.com's enterprise search API

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

Import the tools and add them to your AI SDK configuration:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

// Create your AI model provider
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: {
    search: youSearch(),
    agent: youExpress(),
    extract: youContents(),
  },
  maxSteps: 5,
  prompt: 'Search for the latest developments in quantum computing',
});

console.log(result.text);
```

Set your API keys as environment variables:

```bash
export YDC_API_KEY=your-api-key-here
export ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

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

### Passing API key directly

You can configure tools individually instead of using environment variables:

```typescript
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const search = youSearch({
  apiKey: 'your-api-key-here', // Override YDC_API_KEY environment variable
});
```

### Configuration type

```typescript
export type YouToolsConfig = {
  apiKey?: string;  // You.com API key (defaults to YDC_API_KEY env var)
};
```

### Using different model providers

This plugin works with any AI SDK compatible model provider:

```typescript
// Anthropic Claude
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: { search: youSearch() },
  prompt: 'Search for AI news',
});

// OpenAI
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const result = await generateText({
  model: openai('gpt-4'),
  tools: { search: youSearch() },
  prompt: 'Search for AI news',
});

// Google Gemini
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  tools: { search: youSearch() },
  prompt: 'Search for AI news',
});
```

</details>

## Available tools

This plugin provides three tools that your AI can use automatically:

### youSearch()

Comprehensive web and news search with advanced filtering capabilities. Perfect for finding current information, research articles, documentation, and news stories.

**When your AI will use this:**
- Searching for current information or news
- Finding specific content with filters (dates, sites, file types)
- Research queries requiring multiple results

### youExpress()

Fast AI-powered agent that provides synthesized answers with optional real-time web search. Ideal for straightforward questions that benefit from AI interpretation.

**When your AI will use this:**
- Direct questions needing quick answers
- Queries benefiting from AI synthesis
- Requests for explanations or summaries with web context

### youContents()

Extract full page content from URLs in markdown or HTML format. Useful for documentation analysis, content processing, and batch URL extraction.

**When your AI will use this:**
- Extracting content from specific URLs
- Processing multiple pages in batch
- Analyzing webpage content for further processing

---

**Note**: Your AI automatically selects the right tool based on the user's request. Simply set `maxSteps` to allow multiple tool calls, and your AI handles the orchestration.

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
const search = youSearch({ apiKey: 'your-api-key-here' });
```

### Problem: AI isn't using the tools

**Solution**: Make sure you're setting `maxSteps` to allow multiple tool calls:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: { search: youSearch() },
  maxSteps: 5,  // Required: allows AI to use tools
  prompt: 'Search for recent AI news',
});
```

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
  tools: { search: youSearch() },
  prompt: 'Search for AI news',
});

// Inspect tool results for errors
console.log(result.toolResults);
```

### Need more help?

- **API Documentation**: [docs/API.md](./docs/API.md) - Complete API reference
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
