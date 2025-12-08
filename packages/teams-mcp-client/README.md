# Microsoft Teams integration library for You.com's MCP server

TypeScript helper library that enables Microsoft Teams bots to seamlessly connect to You.com's Model Context Protocol (MCP) server for real-time web search, AI-powered answers, and content extraction capabilities.

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

### Prerequisites

- Bun >= 1.2.21 (or Node.js >= 18)
- You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys)
- Microsoft Teams bot project using Teams AI Library

### Installation

```bash
# NPM
npm install @youdotcom-oss/teams-mcp-client

# Bun
bun add @youdotcom-oss/teams-mcp-client

# Yarn
yarn add @youdotcom-oss/teams-mcp-client
```

### Quick example

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

// Now your bot can use you-search, you-express, you-contents tools
```

## Configuration

### Using environment variable

```typescript
// Set YDC_API_KEY environment variable
export YDC_API_KEY=your-api-key-here

// Plugin will automatically use it
const { plugin, config } = createMcpPlugin();
```

### Using configuration object

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

The library throws `McpPluginError` for configuration and connection issues:

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

## Examples

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

// The bot can now use you-search, you-express, and you-contents tools automatically
```

### Custom timeout and headers

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

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  debug: true, // Logs plugin creation and configuration
});

// Output:
// [teams-mcp-client] Plugin created successfully
// [teams-mcp-client] MCP Server URL: https://api.you.com/mcp
// [teams-mcp-client] Timeout: 30000
```

## Troubleshooting

### API key not found

**Error**: "API key is required"

**Solution**: Set the `YDC_API_KEY` environment variable or pass `apiKey` in config:

```bash
export YDC_API_KEY=your-api-key-here
```

### Connection timeout

**Error**: "Connection timeout" or "TIMEOUT" error code

**Solution**: Increase timeout in configuration:

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  timeout: 60000, // 60 seconds
});
```

### Invalid configuration

**Error**: "Invalid configuration" with validation details

**Solution**: Check that:
- API key is not empty
- MCP URL is a valid URL
- Timeout is positive and ≤ 300000ms (5 minutes)
- Headers is an object with string values

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

For example code and deployment guides, see [docs/examples/](./docs/examples/).

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repository root for guidelines.

## License

MIT - see [LICENSE](../../LICENSE) for details.
