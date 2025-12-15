# @youdotcom-oss/teams-anthropic

Anthropic SDK integration for Microsoft Teams.ai - Use Claude models (Opus, Sonnet, Haiku) in your Teams.ai applications with just a few lines of code.

[![npm version](https://img.shields.io/npm/v/@youdotcom-oss/teams-anthropic.svg)](https://www.npmjs.com/package/@youdotcom-oss/teams-anthropic)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Type-Safe Model Selection** - Use enums instead of error-prone strings
- **Streaming Support** - Get responses token-by-token with `onChunk` callback
- **Function Calling** - Auto-execute functions with Claude's tool use
- **Multi-Part Messages** - Send text and handle complex conversations
- **Full IChatModel Interface** - Drop-in replacement for OpenAI models
- **Configurable** - Set temperature, max tokens, and all Anthropic parameters

## Claude Code Plugin

**For Teams Anthropic Integration**: Use the [teams-anthropic-integration](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/teams-anthropic-integration) Claude Code plugin to quickly set up Teams apps with You.com MCP server integration.

```bash
# Claude Code users
/plugin marketplace add youdotcom-oss/dx-toolkit
/plugin install teams-anthropic-integration
/generate-teams-app
```

**Other AI agents**: Download [AGENTS.md](https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/plugins/teams-anthropic-integration/AGENTS.md) for universal AI agent support (Cursor, Windsurf, Cody, Continue, etc.)

See [Plugin Documentation](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/teams-anthropic-integration) for complete integration guide.

## Getting Started

Get up and running with Claude in your Teams.ai app in 3 quick steps:

### 1. Install the package

```bash
npm install @youdotcom-oss/teams-anthropic @anthropic-ai/sdk
```

### 2. Set your API key

Get your API key from [console.anthropic.com](https://console.anthropic.com/) and set it in your environment:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

### 3. Use it in your app

```typescript
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

const response = await model.send(
  { role: 'user', content: 'What is the capital of France?' }
);

console.log(response.content); // "The capital of France is Paris."
```

That's it! Your Teams.ai app now uses Claude models.

## MCP Client Integration

Integrate with You.com MCP server for web search and AI capabilities:

```typescript
import { App } from '@microsoft/teams.apps';
import { ChatPrompt } from '@microsoft/teams.ai';
import { ConsoleLogger } from '@microsoft/teams.common';
import { McpClientPlugin } from '@microsoft/teams.mcpclient';
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

// Validate required environment variables
if (!process.env.YDC_API_KEY) {
  throw new Error('YDC_API_KEY environment variable is required');
}

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const logger = new ConsoleLogger('mcp-client', { level: 'info' });

const prompt = new ChatPrompt(
  {
    instructions: 'You are a helpful assistant with access to web search and AI capabilities.',
    model: new AnthropicChatModel({
      model: AnthropicModel.CLAUDE_SONNET_4_5,
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
  },
  [new McpClientPlugin({ logger })]
).usePlugin('mcpClient', {
  url: process.env.MCP_SERVER_URL || 'http://localhost:4000/mcp',
  params: {
    headers: {
      'User-Agent': 'teams-ai-mcp-client/1.0.0 (teams.ai; anthropic)',
      Authorization: `Bearer ${process.env.YDC_API_KEY}`,
    },
  },
});

const app = new App();

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  const result = await prompt.send(activity.text);
  if (result.content) {
    await send(result.content);
  }
});

app.start().catch(console.error);
```

**Complete template available**: `node_modules/@youdotcom-oss/teams-anthropic/templates/mcp-client.ts`

## Usage Examples

### Basic Chat

Send a message and get a response:

```typescript
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  requestOptions: {
    max_tokens: 2048,
    temperature: 0.7,
  },
});

const response = await model.send(
  { role: 'user', content: 'Explain quantum computing in simple terms' },
  {
    system: {
      role: 'system',
      content: 'You are a helpful teacher who explains complex topics simply.'
    }
  }
);

console.log(response.content);
```

### Streaming Responses

Get responses token-by-token for a better user experience:

```typescript
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

const response = await model.send(
  { role: 'user', content: 'Write a short story about a robot' },
  {
    onChunk: async (delta) => {
      // Stream each token as it arrives
      process.stdout.write(delta);
    },
  }
);

console.log('\n\nFull response:', response.content);
```

### Function Calling

Let Claude call functions to get information:

```typescript
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

const response = await model.send(
  { role: 'user', content: 'What is the weather in San Francisco?' },
  {
    functions: {
      get_weather: {
        description: 'Get the current weather for a location',
        parameters: {
          location: { type: 'string', description: 'City name' },
        },
        handler: async (args: { location: string }) => {
          // Your API call here
          return { temperature: 72, conditions: 'Sunny' };
        },
      },
    },
  }
);

console.log(response.content); // Claude uses the function result to answer
```

### Conversation with Memory

Maintain context across multiple messages:

```typescript
import { LocalMemory } from '@microsoft/teams.ai';

const memory = new LocalMemory();
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

// First message
await model.send(
  { role: 'user', content: 'My name is Alice' },
  { messages: memory }
);

// Second message - Claude remembers the context
const response = await model.send(
  { role: 'user', content: 'What is my name?' },
  { messages: memory }
);

console.log(response.content); // "Your name is Alice."
```

## Available Models

Choose from the latest Claude models using type-safe enums:

| Enum | Model ID | Description |
|------|----------|-------------|
| `AnthropicModel.CLAUDE_OPUS_4_5` | `claude-opus-4-5-20251101` | Most capable, best for complex tasks |
| `AnthropicModel.CLAUDE_SONNET_4_5` | `claude-sonnet-4-5-20250929` | Balanced intelligence and speed |
| `AnthropicModel.CLAUDE_OPUS_3_5` | `claude-opus-3-5-20240229` | Previous generation Opus |
| `AnthropicModel.CLAUDE_SONNET_3_5` | `claude-3-5-sonnet-20241022` | Previous generation Sonnet |
| `AnthropicModel.CLAUDE_HAIKU_3_5` | `claude-3-5-haiku-20241022` | Fast and efficient |

See all available models with helper functions:

```typescript
import { getAllModels, getModelDisplayName, getModelFamily } from '@youdotcom-oss/teams-anthropic';

const models = getAllModels();
const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_4_5); // "Claude Sonnet 4.5"
const family = getModelFamily(AnthropicModel.CLAUDE_HAIKU_3_5); // "haiku"
```

## Configuration Options

Customize the model behavior with configuration options:

<details>
<summary><strong>AnthropicChatModelOptions</strong></summary>

```typescript
const model = new AnthropicChatModel({
  // Required: Type-safe model selection
  model: AnthropicModel.CLAUDE_SONNET_4_5,

  // Optional: API key (defaults to ANTHROPIC_API_KEY env var)
  apiKey: 'your-api-key',

  // Optional: Custom base URL for proxies
  baseUrl: 'https://your-proxy.com',

  // Optional: Custom headers
  headers: {
    'X-Custom-Header': 'value',
  },

  // Optional: Request timeout in milliseconds
  timeout: 60_000,

  // Optional: Default request options
  requestOptions: {
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
  },

  // Optional: Custom logger
  logger: myLogger,
});
```
</details>

<details>
<summary><strong>Request Options (per message)</strong></summary>

```typescript
const response = await model.send(message, {
  // System message
  system: { role: 'system', content: 'You are a helpful assistant' },

  // Memory for conversation context
  messages: memory,

  // Streaming callback
  onChunk: async (delta) => console.log(delta),

  // Function/tool definitions
  functions: {
    function_name: {
      description: 'Function description',
      parameters: { /* JSON schema */ },
      handler: async (args) => { /* implementation */ },
    },
  },

  // Auto-execute functions (default: true)
  autoFunctionCalling: true,

  // Override default request options
  request: {
    max_tokens: 2048,
    temperature: 0.5,
  },
});
```
</details>

## Troubleshooting

### Error: "API key is required"

**Problem**: You're getting an authentication error when trying to use the model.

**Solution**: Make sure you've set your Anthropic API key:

```bash
# Option 1: Environment variable
export ANTHROPIC_API_KEY=your-api-key-here

# Option 2: Pass directly in code
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  apiKey: 'your-api-key-here',
});
```

### Error: "Invalid model identifier"

**Problem**: You're passing a string instead of using the enum.

**Solution**: Always use the `AnthropicModel` enum:

```typescript
// ✅ Correct
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

// ❌ Wrong
const model = new AnthropicChatModel({
  model: 'claude-sonnet-4-5-20250929', // Type error!
});
```

### Streaming not working

**Problem**: You're not seeing token-by-token responses.

**Solution**: Make sure you provide the `onChunk` callback:

```typescript
const response = await model.send(message, {
  onChunk: async (delta) => {
    // This callback is required for streaming
    process.stdout.write(delta);
  },
});
```

### Functions not executing automatically

**Problem**: Function calls are returned but not executed.

**Solution**: Functions auto-execute by default. If you want to control execution manually, set `autoFunctionCalling: false`:

```typescript
const response = await model.send(message, {
  functions: myFunctions,
  autoFunctionCalling: false, // Disable auto-execution
});

// Now response.function_calls will contain the calls to execute manually
```

## API Reference

API documentation is provided via TypeScript types and TSDoc comments in the source code. See the examples above and TypeScript intellisense in your IDE for complete API details.

## Templates

See the [templates directory](./templates) for integration templates:

- [mcp-client.ts](./templates/mcp-client.ts) - Complete MCP client integration with custom user agent headers

Access the template after installation:
```bash
# Template location in your node_modules
node_modules/@youdotcom-oss/teams-anthropic/templates/mcp-client.ts
```

## Contributing

See [AGENTS.md](./AGENTS.md) for development setup and contribution guidelines.

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
