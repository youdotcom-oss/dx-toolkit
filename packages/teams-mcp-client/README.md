# Microsoft Teams integration library for You.com's MCP server

Get your Teams bot connected to You.com's AI-powered search, answers, and content extraction in just 3 quick steps. No hosting required—just add one package and start building smarter bots.

## Features

- **Simple Integration**: One-line setup to connect Teams bots to You.com's MCP server
- **Remote MCP Server**: No hosting required - connects to production server at `https://api.you.com/mcp`
- **Service Account Auth**: Secure API key-based authentication
- **TypeScript First**: Full type safety with exported interfaces
- **Minimal Dependencies**: Only 3 required packages

## Available MCP Tools

Your Teams bot will have access to these You.com MCP tools:

- **`you-search`** - Web and news search with filters (freshness, country, safesearch)
- **`you-express`** - Fast AI-powered answers with optional web search
- **`you-contents`** - Extract full page content in markdown or HTML format

## Getting started

### 1. Installation

Choose your package manager:

```bash
# NPM
npm install @youdotcom-oss/teams-mcp-client

# Bun
bun add @youdotcom-oss/teams-mcp-client

# Yarn
yarn add @youdotcom-oss/teams-mcp-client
```

**Prerequisites**: You'll need Bun >= 1.2.21 (or Node.js >= 18), a You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys), and a Microsoft Teams bot project using Teams AI Library.

### 2. Quick setup

Create your MCP plugin and connect it to your Teams bot:

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

// Create MCP client plugin
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
});

// Use with Teams AI ChatPrompt
const prompt = new ChatPrompt({
  instructions: 'You are a helpful assistant with web search.',
  model: yourModel,
}, [plugin]);

prompt.usePlugin('mcpClient', config);
```

### 3. Test your setup

Try asking your bot:
"What are the latest updates about Claude AI?"

Your bot will automatically use the You.com MCP server to search the web and provide a comprehensive answer with real-time information.

## Use cases & examples

### Common scenarios

**When you need web search:**
- "What's the weather forecast for this weekend?"
- "Show me the latest tech news"
- "Search for Python tutorials for beginners"

**When you need AI-powered answers:**
- "Explain how OAuth 2.0 works"
- "What are the best practices for REST API design?"
- "Compare TypeScript and JavaScript"

**When you need content extraction:**
- "Summarize this article: https://example.com/post"
- "Extract the main content from this URL"
- "Get the text content from this web page"

### Basic search bot

```typescript
import { Application } from '@microsoft/teams.ai';
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
});

const app = new Application({
  ai: {
    planner: {
      instructions: 'You are a helpful search assistant. Use web search to answer questions.',
      model: yourModel,
      plugins: [plugin],
    }
  }
});

// Your bot can now use you-search, you-express, and you-contents tools
```

### Custom timeout and headers

Need more time for complex requests? Just configure the timeout:

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  timeout: 60000, // 60 seconds
  headers: {
    'X-Request-ID': 'custom-request-id',
  },
});
```

### Debug mode

Want to see what's happening under the hood? Enable debug mode:

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  debug: true,
});

// You'll see helpful logs:
// [teams-mcp-client] Plugin created successfully
// [teams-mcp-client] MCP Server URL: https://api.you.com/mcp
// [teams-mcp-client] Timeout: 30000
```

## Configuration

### Using environment variable

The simplest way to configure is with an environment variable:

```typescript
// Set YDC_API_KEY environment variable
export YDC_API_KEY=your-api-key-here

// Plugin will automatically use it
const { plugin, config } = createMcpPlugin();
```

### Using configuration object

For more control, pass a configuration object:

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: 'your-api-key',           // Required (or use YDC_API_KEY env var)
  mcpUrl: 'https://api.you.com/mcp', // Optional (default shown)
  timeout: 30000,                    // Optional, in ms (default: 30s, max: 5min)
  debug: false,                      // Optional (default: false)
  headers: {                         // Optional custom headers
    'X-Custom-Header': 'value',
  },
});
```

### Configuration options

| Option    | Type                        | Required | Default                       | Description                          |
| --------- | --------------------------- | -------- | ----------------------------- | ------------------------------------ |
| `apiKey`  | `string`                    | Yes\*    | `process.env.YDC_API_KEY`     | You.com API key                      |
| `mcpUrl`  | `string`                    | No       | `https://api.you.com/mcp`     | MCP server URL                       |
| `timeout` | `number`                    | No       | `30000` (30 seconds)          | Request timeout in milliseconds      |
| `debug`   | `boolean`                   | No       | `false`                       | Enable debug logging to console      |
| `headers` | `Record<string, string>`    | No       | `{}`                          | Custom HTTP headers                  |

\* Required either in config or as `YDC_API_KEY` environment variable

## Error handling

The library provides clear error messages to help you troubleshoot:

```typescript
import { createMcpPlugin, McpPluginError } from '@youdotcom-oss/teams-mcp-client';

try {
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
  });
} catch (err) {
  if (err instanceof McpPluginError) {
    console.error('MCP Plugin Error:', err.message);
    console.error('Error Code:', err.code);
  }
}
```

### Error codes

- `INVALID_CONFIG` - Configuration validation failed
- `MISSING_API_KEY` - API key not provided
- `PLUGIN_CREATION_FAILED` - Failed to create MCP client plugin
- `CONNECTION_FAILED` - Failed to connect to MCP server
- `TIMEOUT` - Request timeout exceeded

## Troubleshooting

### API key not found

**Issue**: You see "API key is required"

**Solution**: Set the `YDC_API_KEY` environment variable or pass it in your config:

```bash
export YDC_API_KEY=your-api-key-here
```

### Connection timeout

**Issue**: Getting "Connection timeout" or "TIMEOUT" errors

**Solution**: Increase the timeout to give requests more time:

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  timeout: 60000, // Try 60 seconds
});
```

### Invalid configuration

**Issue**: "Invalid configuration" with validation details

**Solution**: Double-check your configuration:
- API key is not empty
- MCP URL is a valid URL
- Timeout is positive and ≤ 300000ms (5 minutes)
- Headers is an object with string values

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](../../LICENSE) for details.
