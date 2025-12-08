# Vercel AI SDK plugin for You.com - API Documentation

Complete API reference for `@youdotcom-oss/ai-sdk-plugin`.

## Installation

\`\`\`bash
npm install @youdotcom-oss/ai-sdk-plugin ai
\`\`\`

## API Reference

### `createYouMCPClient(config?)`

Creates a You.com MCP client for use with Vercel AI SDK.

**Signature:**
\`\`\`typescript
const createYouMCPClient: (
  config?: YouMCPClientConfig
) => Promise<YouMCPClientResult>
\`\`\`

**Parameters:**
- `config` (optional): Configuration options

**Returns:** Promise resolving to `YouMCPClientResult`

**Throws:** `YouMCPClientError` if:
- API key is missing
- Cannot connect to MCP server
- Cannot fetch tools from server

**Example:**
\`\`\`typescript
import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';

const { tools, client, close } = await createYouMCPClient({
  apiKey: process.env.YDC_API_KEY,
  serverUrl: 'http://localhost:4000/mcp',
});
\`\`\`

---

## Types

### `YouMCPClientConfig`

Configuration options for creating the MCP client.

\`\`\`typescript
type YouMCPClientConfig = {
  apiKey?: string;              // You.com API key (or use YDC_API_KEY env var)
  serverUrl?: string;           // Default: 'http://localhost:4000/mcp'
  headers?: Record<string, string>;
  clientName?: string;          // Default: 'youdotcom-ai-sdk-plugin'
  onUncaughtError?: (error: unknown) => void;
};
\`\`\`

**Fields:**
- `apiKey` (optional): You.com API key. If not provided, reads from `YDC_API_KEY` env var
- `serverUrl` (optional): MCP server URL. Defaults to `http://localhost:4000/mcp`
- `headers` (optional): Additional HTTP headers to send with requests
- `clientName` (optional): Client name for logging. Defaults to `youdotcom-ai-sdk-plugin`
- `onUncaughtError` (optional): Error handler for uncaught errors

---

### `YouMCPClientResult`

Return value from `createYouMCPClient()`.

\`\`\`typescript
type YouMCPClientResult = {
  tools: Record<string, CoreTool>;  // AI SDK tools (pass to generateText)
  client: MCPClient;                 // Underlying MCP client (for resources/prompts)
  close: () => Promise<void>;        // Cleanup function
};
\`\`\`

**Fields:**
- `tools`: AI SDK tools ready to use with `generateText()` or `streamText()`
- `client`: Underlying MCP client for advanced use cases
- `close`: Async function to close the connection

**Usage:**
\`\`\`typescript
const { tools, close } = await createYouMCPClient();

try {
  await generateText({ model, tools, prompt });
} finally {
  await close();
}
\`\`\`

---

### `YouMCPClientError`

Error class for client errors.

\`\`\`typescript
class YouMCPClientError extends Error {
  constructor(message: string, cause?: unknown);
  name: 'YouMCPClientError';
  cause?: unknown;
}
\`\`\`

**Fields:**
- `message`: Error description
- `cause` (optional): Underlying error that caused this error

**Example:**
\`\`\`typescript
try {
  await createYouMCPClient();
} catch (error) {
  if (error instanceof YouMCPClientError) {
    console.error('Client error:', error.message);
    console.error('Caused by:', error.cause);
  }
}
\`\`\`

---

## Constants

### `DEFAULT_SERVER_URL`

Default MCP server URL.

\`\`\`typescript
const DEFAULT_SERVER_URL = 'http://localhost:4000/mcp';
\`\`\`

---

### `DEFAULT_CLIENT_NAME`

Default client name for logging.

\`\`\`typescript
const DEFAULT_CLIENT_NAME = 'youdotcom-ai-sdk-plugin';
\`\`\`

---

### `API_KEY_ENV_VAR`

Environment variable name for API key.

\`\`\`typescript
const API_KEY_ENV_VAR = 'YDC_API_KEY';
\`\`\`

---

### `EXPECTED_TOOLS`

Array of expected tool names from MCP server.

\`\`\`typescript
const EXPECTED_TOOLS = ['you-search', 'you-express', 'you-contents'] as const;
type ExpectedToolName = 'you-search' | 'you-express' | 'you-contents';
\`\`\`

---

## Usage with Vercel AI SDK

### Basic Text Generation

\`\`\`typescript
import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const { tools, close } = await createYouMCPClient();

try {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools,
    prompt: 'Search for latest AI news',
  });
  console.log(result.text);
} finally {
  await close();
}
\`\`\`

### Streaming Responses

\`\`\`typescript
import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { streamText } from 'ai';

const { tools, close } = await createYouMCPClient();

try {
  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    tools,
    prompt: 'Search for latest AI news',
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
} finally {
  await close();
}
\`\`\`

### Multi-Step Tool Usage

\`\`\`typescript
const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools,
  maxSteps: 5,  // Allow multiple tool calls
  prompt: 'Search for AI news, then extract content from the top result',
});
\`\`\`

---

## Error Handling

### Handling Configuration Errors

\`\`\`typescript
try {
  const client = await createYouMCPClient({
    // Missing apiKey
  });
} catch (error) {
  if (error instanceof YouMCPClientError) {
    if (error.message.includes('API key required')) {
      console.error('Set YDC_API_KEY environment variable');
    }
  }
}
\`\`\`

### Handling Connection Errors

\`\`\`typescript
try {
  const client = await createYouMCPClient({
    apiKey: process.env.YDC_API_KEY,
    serverUrl: 'http://localhost:4000/mcp',
  });
} catch (error) {
  if (error instanceof YouMCPClientError) {
    if (error.message.includes('Failed to create MCP client')) {
      console.error('MCP server not running. Start with: bun --cwd packages/mcp start');
    }
  }
}
\`\`\`

---

## Advanced Usage

### Custom Error Handling

\`\`\`typescript
const { tools, close } = await createYouMCPClient({
  apiKey: process.env.YDC_API_KEY,
  onUncaughtError: (error) => {
    logger.error('[MCP Client Error]', error);
  },
});
\`\`\`

### Custom Headers

\`\`\`typescript
const { tools, close } = await createYouMCPClient({
  apiKey: process.env.YDC_API_KEY,
  headers: {
    'X-Custom-Header': 'value',
  },
});
\`\`\`

### Using MCP Client Directly

\`\`\`typescript
const { client, close } = await createYouMCPClient();

// Access MCP resources
const resources = await client.resources();

// Access MCP prompts
const prompts = await client.prompts();

await close();
\`\`\`

---

## Tool Reference

The MCP server provides three tools:

### `you-search`

Web and news search using You.com's search API.

**Parameters:**
- `query` (string): Search query
- `count` (number, optional): Number of results
- `country` (string, optional): Country code
- `safesearch` (string, optional): Safe search level

### `you-express`

Fast AI responses with optional web search integration.

**Parameters:**
- `input` (string): Query or prompt
- `tools` (array, optional): Enable web search

### `you-contents`

Extract web page content in markdown or HTML format.

**Parameters:**
- `urls` (array): URLs to extract content from
- `format` (string, optional): Output format ('markdown' or 'html')
