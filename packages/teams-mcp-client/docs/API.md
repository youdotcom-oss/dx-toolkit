# Microsoft Teams integration library for You.com's MCP server - API Documentation

Complete API reference for `@youdotcom-oss/teams-mcp-client`.

## Installation

```bash
npm install @youdotcom-oss/teams-mcp-client
```

## API Reference

### `createMcpPlugin(config?)`

Creates a Microsoft Teams MCP client plugin configured to connect to You.com's remote MCP server.

**Parameters:**

- `config` (optional): `McpPluginConfig` object

**Returns:** `McpPluginResult` object containing:
- `plugin`: McpClientPlugin instance
- `config`: Validated configuration

**Example:**

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  mcpUrl: 'https://api.you.com/mcp', // Optional, this is the default
  timeout: 30000, // Optional, 30 seconds default
  debug: false, // Optional, false by default
});
```

### `McpPluginConfig`

Configuration interface for the MCP plugin.

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiKey` | `string` | No* | `process.env.YDC_API_KEY` | You.com API key |
| `mcpUrl` | `string` | No | `'https://api.you.com/mcp'` | MCP server URL |
| `headers` | `Record<string, string>` | No | `{}` | Additional HTTP headers |
| `timeout` | `number` | No | `30000` | Request timeout in milliseconds |
| `debug` | `boolean` | No | `false` | Enable debug logging |

*API key is required but can be provided via environment variable `YDC_API_KEY`

### `McpPluginResult`

Return type of `createMcpPlugin()`.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `plugin` | `McpClientPlugin` | Teams MCP client plugin instance |
| `config` | `McpPluginConfig` | Validated configuration object |

## Usage Examples

### Basic Usage

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

// Create plugin with API key from environment
const { plugin, config } = createMcpPlugin();

// Use with Teams AI ChatPrompt
const prompt = new ChatPrompt({
  instructions: 'You are a helpful assistant with web search.',
  model: yourModel,
}, [plugin]);

prompt.usePlugin('mcpClient', config);
```

### Custom Configuration

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

const { plugin, config } = createMcpPlugin({
  apiKey: 'your-api-key',
  mcpUrl: 'https://api.you.com/mcp',
  headers: {
    'X-Custom-Header': 'value',
  },
  timeout: 60000, // 60 seconds
  debug: true,
});
```

### Error Handling

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

try {
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
  });

  // Use plugin...
} catch (error) {
  console.error('Failed to create MCP plugin:', error);
  // Handle error appropriately
}
```

## Available MCP Tools

Once configured, your Teams bot can use these tools from You.com's MCP server:

### `you-search`
Web and news search with advanced filtering capabilities.

### `you-express`
Fast AI-powered responses with optional real-time web search.

### `you-contents`
Content extraction from web pages in markdown or HTML format.

For detailed tool documentation, see [You.com MCP Server documentation](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp#readme).

## TypeScript Support

This library is written in TypeScript and exports all types for full type safety:

```typescript
import type { McpPluginConfig, McpPluginResult } from '@youdotcom-oss/teams-mcp-client';
```

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/teams-mcp-client/issues)
- **Email**: support@you.com
- **Documentation**: [README.md](../README.md)
