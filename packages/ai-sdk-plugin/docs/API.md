# Vercel AI SDK Plugin for You.com - API Reference

Complete API reference for `@youdotcom-oss/ai-sdk-plugin`.

## Installation

```bash
npm install @youdotcom-oss/ai-sdk-plugin ai
```

## Quick Start

```typescript
import { generateText } from 'ai';
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
    agent: youExpress(),
    extract: youContents(),
  },
  prompt: 'Search for AI news and extract details',
});
```

---

## Tool Functions

### `youSearch(config?)`

Creates a web search tool for Vercel AI SDK that searches the web using You.com's Search API.

**Signature:**
```typescript
const youSearch: (config?: YouToolsConfig) => CoreTool
```

**Parameters:**
- `config` (optional): Configuration options
  - `apiKey` (string, optional): You.com API key. If not provided, reads from `YDC_API_KEY` environment variable.

**Returns:** AI SDK `CoreTool` instance ready to use with `generateText()` or `streamText()`

**Tool Parameters** (passed by AI model):
- `query` (string, required): Search query
- `count` (number, optional): Number of results to return (default: 10, max: 20)
- `country` (string, optional): Country code for localized results (e.g., "US", "GB")
- `safesearch` (string, optional): Safe search level ("off", "moderate", "strict")
- `freshness` (string, optional): Time range filter:
  - `"day"` - Results from last 24 hours
  - `"week"` - Results from last 7 days
  - `"month"` - Results from last 30 days
  - `"year"` - Results from last 365 days
  - Custom range: `"YYYY-MM-DDtoYYYY-MM-DD"` (e.g., "2024-01-01to2024-12-31")
- `exactTerms` (string, optional): Exact terms to match (pipe-separated)
- `excludeTerms` (string, optional): Terms to exclude (pipe-separated)
- `fileType` (string, optional): Filter by file type (e.g., "pdf", "doc")
- `language` (string, optional): ISO 639-1 language code (e.g., "en", "es")
- `site` (string, optional): Restrict search to specific domain

**Returns** (to AI model):
- `text` (string): Formatted search results with titles, snippets, and URLs
- `data` (object): Structured search results including web results and news articles

**Example:**
```typescript
import { generateText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

// Using environment variable
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'What are the latest AI developments?',
});

// Using explicit API key
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch({ apiKey: process.env.YDC_API_KEY }),
  },
  prompt: 'Search for TypeScript best practices',
});
```

**Advanced Usage:**
```typescript
// The AI model can use search filters
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'Search for PDF documents about machine learning from the last month',
});
// AI model will automatically use fileType: "pdf" and freshness: "month"
```

---

### `youExpress(config?)`

Creates an AI agent tool for Vercel AI SDK that provides fast answers with optional web search integration.

**Signature:**
```typescript
const youExpress: (config?: YouToolsConfig) => CoreTool
```

**Parameters:**
- `config` (optional): Configuration options
  - `apiKey` (string, optional): You.com API key. If not provided, reads from `YDC_API_KEY` environment variable.

**Returns:** AI SDK `CoreTool` instance ready to use with `generateText()` or `streamText()`

**Tool Parameters** (passed by AI model):
- `input` (string, required): Query or prompt for the AI agent
- `tools` (array, optional): Array of tool objects to enable features
  - Default: `[{ type: "web_search" }]` (web search enabled)
  - Pass empty array `[]` to disable web search

**Returns** (to AI model):
- `text` (string): AI-generated answer with web context (if enabled)
- `data` (object): Structured response including answer and optional web results

**Example:**
```typescript
import { generateText } from 'ai';
import { youExpress } from '@youdotcom-oss/ai-sdk-plugin';

// Fast AI answers with web search
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    agent: youExpress(),
  },
  prompt: 'What are the key benefits of using Model Context Protocol?',
});

// The AI model will use the agent tool to get a quick answer
console.log(result.text);
```

**Use Cases:**
- Quick factual answers with real-time web information
- Straightforward queries that don't require extensive research
- Faster than full web search when you need a direct answer

---

### `youContents(config?)`

Creates a content extraction tool for Vercel AI SDK that extracts full page content from URLs.

**Signature:**
```typescript
const youContents: (config?: YouToolsConfig) => CoreTool
```

**Parameters:**
- `config` (optional): Configuration options
  - `apiKey` (string, optional): You.com API key. If not provided, reads from `YDC_API_KEY` environment variable.

**Returns:** AI SDK `CoreTool` instance ready to use with `generateText()` or `streamText()`

**Tool Parameters** (passed by AI model):
- `urls` (array, required): Array of URLs to extract content from (max 10 URLs)
- `format` (string, optional): Output format
  - `"markdown"` (default): Clean markdown text, best for content extraction
  - `"html"`: Preserves layout and structure

**Returns** (to AI model):
- `text` (string): Formatted extracted content from all URLs
- `data` (object): Structured response with content for each URL

**Example:**
```typescript
import { generateText } from 'ai';
import { youContents } from '@youdotcom-oss/ai-sdk-plugin';

// Extract and summarize web page
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    extract: youContents(),
  },
  prompt: 'Extract content from https://modelcontextprotocol.io and summarize what MCP is',
});

// Extract from multiple URLs
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    extract: youContents(),
  },
  prompt: 'Compare the features on https://vercel.com/ai and https://anthropic.com',
});
```

**Format Comparison:**

| Format | Best For | Preserves |
|--------|----------|-----------|
| `markdown` | Text extraction, content analysis, summarization | Text content, links, basic formatting |
| `html` | Layout analysis, visual structure, interactive content | HTML structure, CSS classes, layout |

---

## Types

### `YouToolsConfig`

Configuration options for all tool functions.

```typescript
type YouToolsConfig = {
  apiKey?: string;
};
```

**Fields:**
- `apiKey` (optional): You.com API key. If not provided, reads from `YDC_API_KEY` environment variable.

**Example:**
```typescript
// Using environment variable
const search = youSearch();

// Using explicit API key
const search = youSearch({ apiKey: 'your-api-key-here' });

// Configure once, use everywhere
const config = { apiKey: process.env.YDC_API_KEY };
const tools = {
  search: youSearch(config),
  agent: youExpress(config),
  extract: youContents(config),
};
```

---

### Exported Types from @youdotcom-oss/mcp

This plugin re-exports types from `@youdotcom-oss/mcp` for convenience:

```typescript
export type {
  ContentsApiResponse,
  ContentsQuery,
  ExpressAgentInput,
  ExpressAgentMcpResponse,
  SearchQuery,
  SearchResponse,
} from '@youdotcom-oss/mcp';
```

**Type Definitions:**

**`SearchQuery`**: Parameters for search tool
```typescript
type SearchQuery = {
  query: string;
  count?: number;
  country?: string;
  safesearch?: string;
  freshness?: string;
  exactTerms?: string;
  excludeTerms?: string;
  fileType?: string;
  language?: string;
  site?: string;
  // Additional fields...
};
```

**`SearchResponse`**: Search API response structure
```typescript
type SearchResponse = {
  results: Array<{
    title: string;
    url: string;
    description: string;
    // Additional fields...
  }>;
  news?: Array<{
    title: string;
    url: string;
    snippet: string;
    // Additional fields...
  }>;
};
```

**`ExpressAgentInput`**: Parameters for agent tool
```typescript
type ExpressAgentInput = {
  input: string;
  tools?: Array<{ type: string }>;
};
```

**`ExpressAgentMcpResponse`**: Agent API response structure
```typescript
type ExpressAgentMcpResponse = {
  answer: string;
  webSearch?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
};
```

**`ContentsQuery`**: Parameters for contents tool
```typescript
type ContentsQuery = {
  urls: string[];
  format?: 'markdown' | 'html';
};
```

**`ContentsApiResponse`**: Contents API response structure
```typescript
type ContentsApiResponse = {
  results: Array<{
    url: string;
    content: string;
    // Additional fields...
  }>;
};
```

---

## Usage Patterns

### Basic Text Generation

```typescript
import { generateText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'What are the latest developments in AI?',
});

console.log(result.text);
```

### Streaming Responses

```typescript
import { streamText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const result = streamText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'Search for AI news and summarize',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Multi-Tool Usage

```typescript
import { generateText } from 'ai';
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
    agent: youExpress(),
    extract: youContents(),
  },
  maxSteps: 5,  // Allow multiple tool calls
  prompt: 'Search for the latest Vercel AI SDK docs, extract the content, and summarize key features',
});
```

### Multi-Step Workflows

```typescript
import { generateText } from 'ai';
import { youSearch, youContents } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
    extract: youContents(),
  },
  maxSteps: 5,
  prompt: 'Find the official React documentation, extract the content about hooks, and explain useState',
});

// The AI will:
// 1. Use youSearch to find React docs
// 2. Use youContents to extract page content
// 3. Synthesize an explanation of useState
```

### Tool Introspection

```typescript
import { generateText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
  },
  prompt: 'Search for TypeScript best practices',
});

// Inspect which tools were called
console.log('Tools used:', result.toolCalls.length);
for (const call of result.toolCalls) {
  console.log(`- ${call.toolName}`);
  console.log(`  Input:`, call.args);
}

// Inspect tool results
for (const toolResult of result.toolResults) {
  console.log('Tool result:', toolResult);
}
```

---

## Error Handling

### Missing API Key

```typescript
import { generateText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

try {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      search: youSearch({ apiKey: '' }),  // Empty API key
    },
    prompt: 'Search for something',
  });
} catch (error) {
  if (error instanceof Error && error.message.includes('YDC_API_KEY')) {
    console.error('Set YDC_API_KEY environment variable or pass apiKey in config');
  }
}
```

### Invalid API Key

```typescript
try {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      search: youSearch({ apiKey: 'invalid-key' }),
    },
    prompt: 'Search for something',
  });
} catch (error) {
  if (error instanceof Error && error.message.includes('401')) {
    console.error('Invalid API key. Get a new key at: https://you.com/platform/api-keys');
  }
}
```

### Rate Limit Handling

```typescript
try {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      search: youSearch(),
    },
    prompt: 'Search for something',
  });
} catch (error) {
  if (error instanceof Error && error.message.includes('429')) {
    console.error('Rate limit exceeded. Wait and retry.');
  }
}
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `YDC_API_KEY` | Yes* | You.com API key | `your-youdotcom-api-key` |
| `ANTHROPIC_API_KEY` | Yes** | Anthropic API key (for AI models) | `sk-ant-...` |

\* Required unless passed in `config.apiKey`
\** Required only if using Anthropic models

**Setup:**
```bash
export YDC_API_KEY="your-youdotcom-api-key-here"
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

Get your API keys:
- You.com: [you.com/platform/api-keys](https://you.com/platform/api-keys)
- Anthropic: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

## Performance

This plugin adds minimal overhead over direct API calls. See [PERFORMANCE.md](./PERFORMANCE.md) for detailed performance metrics and testing methodology.

**Key metrics**:
- **Processing lag**: < 80ms (tool wrapper, validation, formatting)
- **Overhead percentage**: < 35% relative to raw API calls
- **Memory overhead**: < 350KB per tool instance

---

## Examples

See the [examples/](../examples/) directory for complete working examples:

- **basic-search.ts** - Web search with `youSearch()`
- **agent-response.ts** - Fast AI answers with `youExpress()`
- **content-extraction.ts** - Extract web pages with `youContents()`
- **streaming-text.ts** - Real-time streaming responses
- **error-handling.ts** - Graceful error handling patterns

Run examples:
```bash
cd packages/ai-sdk-plugin
bun examples/basic-search.ts
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Documentation**: [README.md](../README.md) | [AGENTS.md](../AGENTS.md)
- **API Keys**: [you.com/platform/api-keys](https://you.com/platform/api-keys)
- **Email**: support@you.com
