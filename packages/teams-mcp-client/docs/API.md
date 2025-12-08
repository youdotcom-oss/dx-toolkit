# Microsoft Teams integration library for You.com's MCP server - API Documentation

Complete API reference for `@youdotcom-oss/teams-mcp-client`.

## Installation

```bash
npm install @youdotcom-oss/teams-mcp-client
```

## Table of Contents

- [Functions](#functions)
  - [createMcpPlugin](#createmcppluginconfig)
- [Types](#types)
  - [McpPluginConfig](#mcppluginconfig)
  - [McpPluginResult](#mcppluginresult)
- [Error Handling](#error-handling)
  - [McpPluginError](#mcppluginerror)
  - [Error Codes](#error-codes)
- [Validation Rules](#validation-rules)
- [Usage Examples](#usage-examples)
- [Available MCP Tools](#available-mcp-tools)

## Functions

### `createMcpPlugin(config?)`

Creates a Microsoft Teams MCP client plugin configured to connect to You.com's remote MCP server.

**Signature:**

```typescript
function createMcpPlugin(config?: Partial<McpPluginConfig>): McpPluginResult
```

**Parameters:**

- `config` (optional): Partial `McpPluginConfig` object with configuration options

**Returns:** `McpPluginResult` object containing:
- `plugin`: `McpClientPlugin` instance ready to use with Teams AI
- `config`: Validated and merged configuration object with all defaults applied

**Throws:**
- `McpPluginError` with code `MISSING_API_KEY` if API key is not provided
- `McpPluginError` with code `INVALID_CONFIG` if configuration validation fails
- `McpPluginError` with code `PLUGIN_CREATION_FAILED` if plugin instantiation fails

**Example:**

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

// Minimal usage (uses YDC_API_KEY environment variable)
const { plugin, config } = createMcpPlugin();

// With configuration
const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  mcpUrl: 'https://api.you.com/mcp', // Optional, this is the default
  timeout: 30000, // Optional, 30 seconds default
  debug: false, // Optional, false by default
});
```

## Types

### `McpPluginConfig`

Configuration interface for the MCP plugin.

**Type Definition:**

```typescript
interface McpPluginConfig {
  apiKey?: string;
  mcpUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  debug?: boolean;
}
```

**Properties:**

| Property | Type | Required | Default | Description | Validation |
|----------|------|----------|---------|-------------|------------|
| `apiKey` | `string` | No* | `process.env.YDC_API_KEY` | You.com API key for authentication | Must be non-empty string |
| `mcpUrl` | `string` | No | `'https://api.you.com/mcp'` | Remote MCP server URL | Must be valid URL |
| `headers` | `Record<string, string>` | No | `{}` | Additional HTTP headers to send with requests | Must be object with string values |
| `timeout` | `number` | No | `30000` (30 seconds) | Request timeout in milliseconds | Must be positive integer ≤ 300000 (5 minutes) |
| `debug` | `boolean` | No | `false` | Enable debug logging to console | Boolean value |

\* API key is required but can be provided via environment variable `YDC_API_KEY`

**Notes:**
- Configuration is validated using Zod schemas
- Explicit config values take precedence over environment variables
- Invalid configurations throw `McpPluginError` with validation details

### `McpPluginResult`

Return type of `createMcpPlugin()` function.

**Type Definition:**

```typescript
interface McpPluginResult {
  plugin: McpClientPlugin;
  config: McpPluginConfig & {
    url: string;
    params: {
      headers: Record<string, string>;
      timeout: number;
    };
  };
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `plugin` | `McpClientPlugin` | Teams MCP client plugin instance from `@microsoft/teams.mcpclient` |
| `config` | Extended `McpPluginConfig` | Validated configuration with additional fields for Teams AI compatibility |
| `config.url` | `string` | MCP server URL (same as `mcpUrl`) for Teams AI `usePlugin()` |
| `config.params` | `object` | Request parameters including headers and timeout |
| `config.params.headers` | `Record<string, string>` | Merged headers including `Authorization: Bearer {apiKey}` |
| `config.params.timeout` | `number` | Request timeout in milliseconds |

**Usage:**

```typescript
const { plugin, config } = createMcpPlugin({ apiKey: 'key' });

// Use plugin with Teams AI
prompt.usePlugin('mcpClient', config);

// Access validated config
console.log(config.mcpUrl); // 'https://api.you.com/mcp'
console.log(config.params.headers.Authorization); // 'Bearer key'
```

## Error Handling

### `McpPluginError`

Custom error class for MCP plugin errors. Extends built-in `Error` class.

**Type Definition:**

```typescript
class McpPluginError extends Error {
  constructor(message: string, code?: string);
  readonly code?: string;
  readonly name: 'McpPluginError';
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Human-readable error message |
| `code` | `string` (optional) | Error code from `ErrorCodes` enum |
| `name` | `string` | Always `'McpPluginError'` |
| `stack` | `string` | Error stack trace |

**Example:**

```typescript
import { createMcpPlugin, McpPluginError } from '@youdotcom-oss/teams-mcp-client';

try {
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
  });
} catch (err) {
  if (err instanceof McpPluginError) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
  }
}
```

### Error Codes

Standard error codes returned in `McpPluginError.code`:

| Code | Description | Common Causes |
|------|-------------|---------------|
| `INVALID_CONFIG` | Configuration validation failed | Invalid URL, negative timeout, timeout > 5min, empty API key |
| `MISSING_API_KEY` | API key not provided in config or environment | `YDC_API_KEY` env var not set and no `apiKey` in config |
| `PLUGIN_CREATION_FAILED` | Failed to instantiate MCP client plugin | Internal error creating `McpClientPlugin` instance |
| `CONNECTION_FAILED` | Failed to connect to MCP server | Network error, invalid URL, server unavailable |
| `TIMEOUT` | Request timeout exceeded | Server not responding within timeout period |

**Example - Handling Specific Errors:**

```typescript
import { createMcpPlugin, McpPluginError, ErrorCodes } from '@youdotcom-oss/teams-mcp-client';

try {
  const { plugin, config } = createMcpPlugin();
} catch (err) {
  if (err instanceof McpPluginError) {
    switch (err.code) {
      case ErrorCodes.MISSING_API_KEY:
        console.error('Please set YDC_API_KEY environment variable');
        break;
      case ErrorCodes.INVALID_CONFIG:
        console.error('Configuration error:', err.message);
        break;
      case ErrorCodes.TIMEOUT:
        console.error('Connection timeout - try increasing timeout value');
        break;
      default:
        console.error('Unknown error:', err.message);
    }
  }
}
```

### `wrapError`

Utility function to wrap any error type into `McpPluginError`.

**Type Definition:**

```typescript
function wrapError(err: unknown, context?: string): McpPluginError
```

**Parameters:**

- `err`: Error of any type (Error, string, number, object, etc.)
- `context` (optional): Additional context to prepend to error message

**Returns:** `McpPluginError` instance

**Behavior:**
- If `err` is already `McpPluginError`, returns it unchanged
- If `err` is standard `Error`, wraps with optional context
- For other types, converts to string and wraps with "Unknown error" prefix

## Validation Rules

Configuration is validated using Zod schemas with the following rules:

### API Key Validation

- **Type**: String
- **Required**: Yes (from config or `YDC_API_KEY` env var)
- **Constraints**: Must be non-empty string
- **Error**: "API key cannot be empty" or "API key is required"

### MCP URL Validation

- **Type**: String (URL)
- **Required**: No
- **Default**: `'https://api.you.com/mcp'`
- **Constraints**: Must be valid URL format (validated by Zod)
- **Error**: "MCP URL must be a valid URL"

### Timeout Validation

- **Type**: Number (integer)
- **Required**: No
- **Default**: `30000` (30 seconds)
- **Constraints**:
  - Must be positive integer
  - Must be ≤ 300000 (5 minutes)
- **Error**: "Invalid configuration" with Zod validation details

### Headers Validation

- **Type**: Object (Record<string, string>)
- **Required**: No
- **Default**: `{}`
- **Constraints**:
  - Must be object
  - All keys and values must be strings
- **Error**: "Invalid configuration" with Zod validation details

### Debug Validation

- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Constraints**: Must be boolean value
- **Error**: "Invalid configuration" with Zod validation details

### Strict Mode

Configuration uses Zod's strict mode, which means:
- Extra properties not defined in schema will cause validation error
- This prevents typos and incorrect property names

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
    'X-Request-ID': 'unique-id',
  },
  timeout: 60000, // 60 seconds
  debug: true,
});
```

### With Teams Application

```typescript
import { Application } from '@microsoft/teams.ai';
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
});

const app = new Application({
  ai: {
    planner: {
      instructions: 'You are a helpful search assistant.',
      model: yourModel,
      plugins: [plugin],
    }
  }
});

// Plugin is now available to the AI model
```

### Error Handling with Retry

```typescript
import { createMcpPlugin, McpPluginError, ErrorCodes } from '@youdotcom-oss/teams-mcp-client';

async function createPluginWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
        timeout: 30000 * attempt, // Increase timeout on retries
      });
    } catch (err) {
      if (err instanceof McpPluginError && err.code === ErrorCodes.TIMEOUT) {
        if (attempt < maxRetries) {
          console.log(`Timeout on attempt ${attempt}, retrying...`);
          continue;
        }
      }
      throw err; // Re-throw if not timeout or max retries reached
    }
  }
}
```

### Debug Mode

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

const { plugin, config } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  debug: true,
});

// Console output:
// [teams-mcp-client] Plugin created successfully
// [teams-mcp-client] MCP Server URL: https://api.you.com/mcp
// [teams-mcp-client] Timeout: 30000
```

### Accessing Configuration

```typescript
const { plugin, config } = createMcpPlugin({
  apiKey: 'my-api-key',
  timeout: 45000,
});

// Access validated config
console.log(config.apiKey);           // 'my-api-key'
console.log(config.mcpUrl);           // 'https://api.you.com/mcp'
console.log(config.timeout);          // 45000
console.log(config.url);              // 'https://api.you.com/mcp' (for Teams AI)
console.log(config.params.timeout);   // 45000

// Authorization header is automatically added
console.log(config.params.headers.Authorization); // 'Bearer my-api-key'
```

## Available MCP Tools

Once configured, your Teams bot can use these tools from You.com's MCP server:

### `you-search`

Web and news search with advanced filtering capabilities.

**Features:**
- Web search with snippets and metadata
- News article search
- Filters: freshness, country, safesearch, file types
- Pagination support

### `you-express`

Fast AI-powered responses with optional real-time web search.

**Features:**
- AI-synthesized answers
- Optional web search integration
- Fast response times
- Structured output format

### `you-contents`

Content extraction from web pages in markdown or HTML format.

**Features:**
- Full page content extraction
- Multiple URL support in single request
- Markdown or HTML output
- Preserves page structure

For detailed tool documentation and parameters, see [You.com MCP Server documentation](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp#readme).

## TypeScript Support

This library is written in TypeScript and exports all types for full type safety:

```typescript
import type {
  McpPluginConfig,
  McpPluginResult
} from '@youdotcom-oss/teams-mcp-client';

import {
  McpPluginError,
  ErrorCodes,
  wrapError
} from '@youdotcom-oss/teams-mcp-client';
```

### Type Imports

```typescript
// Import types only (no runtime code)
import type { McpPluginConfig } from '@youdotcom-oss/teams-mcp-client';

function configure(config: Partial<McpPluginConfig>) {
  // ...
}
```

### Runtime Imports

```typescript
// Import runtime code
import { createMcpPlugin, McpPluginError } from '@youdotcom-oss/teams-mcp-client';
```

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/teams-mcp-client/issues)
- **Email**: support@you.com
- **Documentation**: [README.md](../README.md)
- **Examples**: [docs/examples/](./examples/)
