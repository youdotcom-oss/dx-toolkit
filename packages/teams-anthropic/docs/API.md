# API Reference

Complete API documentation for `@youdotcom-oss/teams-anthropic`.

## Table of Contents

- [AnthropicChatModel](#anthropicchatmodel)
- [AnthropicModel](#anthropicmodel)
- [Types](#types)
  - [AnthropicChatModelOptions](#anthropicchatmodeloptions)
  - [AnthropicRequestOptions](#anthropicrequestoptions)
- [Helper Functions](#helper-functions)
  - [getModelDisplayName](#getmodeldisplayname)
  - [isValidModel](#isvalidmodel)
  - [getAllModels](#getallmodels)
  - [getModelFamily](#getmodelfamily)
- [Utility Functions](#utility-functions)
  - [transformToAnthropicMessages](#transformtoanthropicmessages)
  - [transformFromAnthropicMessage](#transformfromanthropicmessage)
  - [extractSystemMessage](#extractsystemmessage)

---

## AnthropicChatModel

Main class that implements the `IChatModel` interface from `@microsoft/teams.ai`, enabling Claude models to be used in Teams.ai applications.

### Constructor

```typescript
constructor(options: AnthropicChatModelOptions)
```

Creates a new AnthropicChatModel instance.

**Parameters:**

- `options` ([AnthropicChatModelOptions](#anthropicchatmodeloptions)) - Configuration options

**Throws:**

- `Error` - If API key is not provided and `ANTHROPIC_API_KEY` environment variable is not set

**Example:**

```typescript
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  apiKey: process.env.ANTHROPIC_API_KEY,
  requestOptions: {
    max_tokens: 4096,
    temperature: 0.7,
  },
});
```

### Methods

#### send

```typescript
async send(
  input: Message,
  options?: ChatSendOptions<AnthropicRequestOptions>
): Promise<ModelMessage>
```

Send a message and get a response from Claude.

**Parameters:**

- `input` (`Message`) - The message to send. Can be:
  - User message: `{ role: 'user', content: string }`
  - Model message: `{ role: 'model', content: string, function_calls?: FunctionCall[] }`
  - Function message: `{ role: 'function', function_id: string, content: string }`
  - System message: `{ role: 'system', content: string }`

- `options` (`ChatSendOptions<AnthropicRequestOptions>`) - Optional configuration:
  - `messages` (`IMemory`) - Memory for conversation context
  - `system` (`Message`) - System message
  - `onChunk` (`(delta: string) => Promise<void>`) - Streaming callback
  - `functions` (`Record<string, Function>`) - Function definitions with handlers
  - `autoFunctionCalling` (`boolean`) - Auto-execute functions (default: `true`)
  - `request` ([AnthropicRequestOptions](#anthropicrequestoptions)) - Per-request overrides

**Returns:**

- `Promise<ModelMessage>` - The model's response:
  - `role` (`'model'`) - Always 'model'
  - `content` (`string`) - Text response
  - `function_calls?` (`FunctionCall[]`) - Function calls to execute (if any)

**Behavior:**

1. Initializes conversation memory if not provided
2. Adds input message to memory
3. Handles function execution if input is a model message with function calls
4. Extracts system message from conversation
5. Transforms messages to Anthropic format
6. Calls Anthropic API (streaming or non-streaming based on `onChunk`)
7. Transforms response back to ModelMessage format
8. Adds response to memory
9. Auto-executes functions if `autoFunctionCalling !== false`
10. Returns final response

**Streaming:**

Activated by providing `onChunk` callback:

```typescript
const response = await model.send(message, {
  onChunk: async (delta) => {
    process.stdout.write(delta); // Called for each text token
  },
});
```

**Function Calling:**

Provide function definitions with handlers:

```typescript
const response = await model.send(message, {
  functions: {
    get_weather: {
      description: 'Get weather for a location',
      parameters: {
        location: { type: 'string' },
      },
      handler: async (args: { location: string }) => {
        return { temperature: 72, conditions: 'Sunny' };
      },
    },
  },
});
```

**Error Handling:**

The method catches all errors and returns them as ModelMessage instead of throwing:

```typescript
{
  role: 'model',
  content: 'Error: <error message>',
}
```

**Examples:**

<details>
<summary><strong>Basic Message</strong></summary>

```typescript
const response = await model.send({
  role: 'user',
  content: 'What is the capital of France?',
});

console.log(response.content); // "The capital of France is Paris."
```
</details>

<details>
<summary><strong>With System Message</strong></summary>

```typescript
const response = await model.send(
  { role: 'user', content: 'Explain quantum computing' },
  {
    system: {
      role: 'system',
      content: 'You are a physics teacher who explains complex topics simply.',
    },
  }
);
```
</details>

<details>
<summary><strong>With Memory</strong></summary>

```typescript
import { LocalMemory } from '@microsoft/teams.ai';

const memory = new LocalMemory();

// First message
await model.send(
  { role: 'user', content: 'My name is Alice' },
  { messages: memory }
);

// Second message - Claude remembers context
const response = await model.send(
  { role: 'user', content: 'What is my name?' },
  { messages: memory }
);

console.log(response.content); // "Your name is Alice."
```
</details>

<details>
<summary><strong>Streaming</strong></summary>

```typescript
const response = await model.send(
  { role: 'user', content: 'Write a short story' },
  {
    onChunk: async (delta) => {
      process.stdout.write(delta); // Stream tokens as they arrive
    },
  }
);

console.log('\n\nFull response:', response.content);
```
</details>

<details>
<summary><strong>Function Calling</strong></summary>

```typescript
const response = await model.send(
  { role: 'user', content: 'What is the weather in London?' },
  {
    functions: {
      get_weather: {
        description: 'Get current weather for a location',
        parameters: {
          location: { type: 'string', description: 'City name' },
        },
        handler: async (args: { location: string }) => {
          // Call your weather API
          return { temperature: 18, conditions: 'Cloudy' };
        },
      },
    },
    autoFunctionCalling: true, // Auto-execute (default)
  }
);

// Claude automatically called get_weather and used the result
console.log(response.content); // "The weather in London is currently 18°C and cloudy."
```
</details>

<details>
<summary><strong>Manual Function Execution</strong></summary>

```typescript
const response = await model.send(
  { role: 'user', content: 'What is the weather in Tokyo?' },
  {
    functions: {
      get_weather: { /* ... */ },
    },
    autoFunctionCalling: false, // Disable auto-execution
  }
);

// Check if Claude wants to call functions
if (response.function_calls) {
  for (const call of response.function_calls) {
    console.log(`Claude wants to call: ${call.name}`);
    console.log(`With arguments:`, call.arguments);

    // Execute manually
    const result = await myExecutor(call);

    // Send result back
    const finalResponse = await model.send({
      role: 'function',
      function_id: call.id,
      content: JSON.stringify(result),
    });
  }
}
```
</details>

<details>
<summary><strong>Request Option Overrides</strong></summary>

```typescript
// Set defaults in constructor
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  requestOptions: {
    max_tokens: 4096,
    temperature: 0.7,
  },
});

// Override per request
const response = await model.send(message, {
  request: {
    max_tokens: 1024,    // Override default
    temperature: 0.3,    // Override default
    top_p: 0.9,          // Add new parameter
  },
});
```
</details>

---

## AnthropicModel

Type-safe enum for Claude model selection. Use this instead of string literals to prevent typos and get IDE autocomplete.

### Enum Values

```typescript
enum AnthropicModel {
  CLAUDE_OPUS_4_5 = 'claude-opus-4-5-20251101',
  CLAUDE_SONNET_4_5 = 'claude-sonnet-4-5-20250929',
  CLAUDE_OPUS_3_5 = 'claude-opus-3-5-20240229',
  CLAUDE_SONNET_3_5 = 'claude-3-5-sonnet-20241022',
  CLAUDE_HAIKU_3_5 = 'claude-3-5-haiku-20241022',
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
}
```

### Model Descriptions

| Enum | Family | Version | Description |
|------|--------|---------|-------------|
| `CLAUDE_OPUS_4_5` | Opus | 4.5 | Most capable model, best for complex tasks |
| `CLAUDE_SONNET_4_5` | Sonnet | 4.5 | Balanced intelligence and speed |
| `CLAUDE_OPUS_3_5` | Opus | 3.5 | Previous generation Opus |
| `CLAUDE_SONNET_3_5` | Sonnet | 3.5 | Previous generation Sonnet |
| `CLAUDE_HAIKU_3_5` | Haiku | 3.5 | Fast and efficient |
| `CLAUDE_3_OPUS` | Opus | 3.0 | Legacy Opus |
| `CLAUDE_3_SONNET` | Sonnet | 3.0 | Legacy Sonnet |
| `CLAUDE_3_HAIKU` | Haiku | 3.0 | Legacy Haiku |

**Example:**

```typescript
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

// ✅ Type-safe with autocomplete
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
});

// ❌ TypeScript error - strings not allowed
const model = new AnthropicChatModel({
  model: 'claude-sonnet-4-5-20250929', // Error!
});
```

---

## Types

### AnthropicChatModelOptions

Configuration options for [AnthropicChatModel](#anthropicchatmodel) constructor.

```typescript
type AnthropicChatModelOptions = {
  readonly model: AnthropicModel;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly requestOptions?: AnthropicRequestOptions;
  readonly logger?: ILogger;
};
```

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `model` | [AnthropicModel](#anthropicmodel) | ✅ Yes | - | Claude model to use |
| `apiKey` | `string` | No | `process.env.ANTHROPIC_API_KEY` | Anthropic API key |
| `baseUrl` | `string` | No | `'https://api.anthropic.com'` | Base URL for API (for proxies) |
| `headers` | `Record<string, string>` | No | `undefined` | Custom headers for API requests |
| `timeout` | `number` | No | `60000` | Request timeout in milliseconds |
| `requestOptions` | [AnthropicRequestOptions](#anthropicrequestoptions) | No | `undefined` | Default request options |
| `logger` | `ILogger` | No | `ConsoleLogger` | Logger for debugging |

**Example:**

```typescript
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 90_000,
  headers: {
    'X-Custom-Header': 'value',
  },
  requestOptions: {
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
  },
});
```

---

### AnthropicRequestOptions

Request parameters for Anthropic API. Omits fields that are managed by the `send()` method.

```typescript
type AnthropicRequestOptions = Omit<
  Anthropic.MessageCreateParams,
  'model' | 'messages' | 'system' | 'stream' | 'tools'
>;
```

**Omitted Fields:**

- `model` - Set from constructor options
- `messages` - Built from conversation history
- `system` - Extracted from conversation
- `stream` - Determined by `onChunk` callback presence
- `tools` - Built from `options.functions`

**Available Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `max_tokens` | `number` | Maximum tokens to generate (required, default: 4096) |
| `temperature` | `number` | Sampling temperature 0.0-1.0 (default: 1.0) |
| `top_p` | `number` | Nucleus sampling threshold (default: 1.0) |
| `top_k` | `number` | Top-k sampling (default: none) |
| `stop_sequences` | `string[]` | Stop generation at these sequences |
| `metadata` | `object` | Metadata to attach to request |

**Example:**

```typescript
const requestOptions: AnthropicRequestOptions = {
  max_tokens: 4096,
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  stop_sequences: ['\n\nHuman:', '\n\nAssistant:'],
  metadata: {
    user_id: 'user-123',
  },
};

// Use in constructor (defaults for all requests)
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  requestOptions,
});

// Or per request (overrides defaults)
const response = await model.send(message, {
  request: requestOptions,
});
```

---

## Helper Functions

### getModelDisplayName

Get human-readable display name for a model.

```typescript
function getModelDisplayName(model: AnthropicModel): string
```

**Parameters:**

- `model` ([AnthropicModel](#anthropicmodel)) - Model enum value

**Returns:**

- `string` - Display name (e.g., "Claude Sonnet 4.5")

**Example:**

```typescript
import { AnthropicModel, getModelDisplayName } from '@youdotcom-oss/teams-anthropic';

const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_4_5);
console.log(displayName); // "Claude Sonnet 4.5"
```

---

### isValidModel

Check if a string is a valid model identifier.

```typescript
function isValidModel(value: string): value is AnthropicModel
```

**Parameters:**

- `value` (`string`) - String to validate

**Returns:**

- `boolean` - `true` if value is a valid AnthropicModel identifier

**Example:**

```typescript
import { isValidModel } from '@youdotcom-oss/teams-anthropic';

console.log(isValidModel('claude-sonnet-4-5-20250929')); // true
console.log(isValidModel('invalid-model')); // false

// Type guard usage
if (isValidModel(userInput)) {
  // userInput is now typed as AnthropicModel
  const model = new AnthropicChatModel({ model: userInput });
}
```

---

### getAllModels

Get array of all available model identifiers.

```typescript
function getAllModels(): AnthropicModel[]
```

**Returns:**

- `AnthropicModel[]` - Array of all model enum values

**Example:**

```typescript
import { getAllModels, getModelDisplayName } from '@youdotcom-oss/teams-anthropic';

const models = getAllModels();
console.log(`Available models: ${models.length}`);

for (const model of models) {
  console.log(`- ${getModelDisplayName(model)} (${model})`);
}

// Output:
// Available models: 8
// - Claude Opus 4.5 (claude-opus-4-5-20251101)
// - Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
// ...
```

---

### getModelFamily

Get model family (opus, sonnet, or haiku) for a model.

```typescript
function getModelFamily(model: AnthropicModel): 'opus' | 'sonnet' | 'haiku'
```

**Parameters:**

- `model` ([AnthropicModel](#anthropicmodel)) - Model enum value

**Returns:**

- `'opus' | 'sonnet' | 'haiku'` - Model family

**Example:**

```typescript
import { AnthropicModel, getModelFamily } from '@youdotcom-oss/teams-anthropic';

const family = getModelFamily(AnthropicModel.CLAUDE_SONNET_4_5);
console.log(family); // "sonnet"

// Use for conditional logic
if (getModelFamily(model) === 'opus') {
  console.log('Using most capable model');
}
```

---

## Utility Functions

These functions are exported for advanced users who need fine-grained control over message transformation.

### transformToAnthropicMessages

Transform Teams.ai messages to Anthropic format.

```typescript
function transformToAnthropicMessages(
  messages: Message[]
): Anthropic.MessageParam[]
```

**Parameters:**

- `messages` (`Message[]`) - Teams.ai messages

**Returns:**

- `Anthropic.MessageParam[]` - Anthropic-formatted messages

**Transformations:**

| Teams.ai | Anthropic |
|----------|-----------|
| `role: 'user'` | `role: 'user'` |
| `role: 'model'` | `role: 'assistant'` |
| `role: 'function'` | `role: 'user'` with `tool_result` |
| `function_calls` array | `content` with `tool_use` blocks |

**Example:**

```typescript
import { transformToAnthropicMessages } from '@youdotcom-oss/teams-anthropic';

const teamsMessages = [
  { role: 'user', content: 'Hello' },
  { role: 'model', content: 'Hi there!' },
];

const anthropicMessages = transformToAnthropicMessages(teamsMessages);
// [
//   { role: 'user', content: 'Hello' },
//   { role: 'assistant', content: 'Hi there!' }
// ]
```

---

### transformFromAnthropicMessage

Transform Anthropic message to Teams.ai format.

```typescript
function transformFromAnthropicMessage(
  response: Anthropic.Message
): ModelMessage
```

**Parameters:**

- `response` (`Anthropic.Message`) - Anthropic API response

**Returns:**

- `ModelMessage` - Teams.ai formatted message with:
  - `role: 'model'`
  - `content: string` - Extracted text
  - `function_calls?: FunctionCall[]` - Extracted tool uses

**Example:**

```typescript
import { transformFromAnthropicMessage } from '@youdotcom-oss/teams-anthropic';

const anthropicResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  messages: [{ role: 'user', content: 'Hello' }],
  max_tokens: 1024,
});

const modelMessage = transformFromAnthropicMessage(anthropicResponse);
// {
//   role: 'model',
//   content: 'Hello! How can I help you today?'
// }
```

---

### extractSystemMessage

Extract system message from conversation messages.

```typescript
function extractSystemMessage(messages: Message[]): string | undefined
```

**Parameters:**

- `messages` (`Message[]`) - Conversation messages

**Returns:**

- `string | undefined` - System message content, or `undefined` if not found

**Behavior:**

Anthropic requires system messages as a separate parameter (not in conversation array). This function:
1. Finds first SystemMessage in array
2. Returns its content as string
3. Returns `undefined` if no system message found

**Example:**

```typescript
import { extractSystemMessage } from '@youdotcom-oss/teams-anthropic';

const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello' },
];

const systemMessage = extractSystemMessage(messages);
console.log(systemMessage); // "You are a helpful assistant"

// Use with Anthropic API
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  system: systemMessage,
  messages: transformToAnthropicMessages(messages.filter(m => m.role !== 'system')),
  max_tokens: 1024,
});
```

---

## Error Handling

### API Errors

All API errors are caught and returned as ModelMessage with error content:

```typescript
try {
  const response = await model.send(message);
} catch (err) {
  // This will never throw - errors are returned as ModelMessage
}

// Instead, check response content
const response = await model.send(message);
if (response.content.startsWith('Error:')) {
  console.error('API call failed:', response.content);
}
```

### Function Execution Errors

Function handler errors are caught and returned as function results:

```typescript
const response = await model.send(message, {
  functions: {
    my_function: {
      handler: async (args) => {
        throw new Error('Something went wrong');
      },
    },
  },
});

// Claude receives: "Error: Something went wrong"
// And can respond appropriately
```

### Authentication Errors

```typescript
// Missing API key
const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  // No apiKey, and ANTHROPIC_API_KEY env var not set
});

const response = await model.send(message);
// response.content: "Error: ANTHROPIC_API_KEY environment variable is required"
```

---

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
import {
  AnthropicChatModel,
  AnthropicModel,
  type AnthropicChatModelOptions,
  type AnthropicRequestOptions,
} from '@youdotcom-oss/teams-anthropic';

// Type-safe model selection
const model: AnthropicChatModel = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5, // Only accepts AnthropicModel enum
});

// Type-safe request options
const options: AnthropicRequestOptions = {
  max_tokens: 4096,
  temperature: 0.7,
  // TypeScript error if you use wrong type or invalid field
};

// Type-safe function definitions
const response = await model.send(message, {
  functions: {
    get_weather: {
      handler: async (args: { location: string }) => {
        // args is typed based on your function signature
        return { temperature: 72 };
      },
    },
  },
});

// Type-safe response
const content: string = response.content;
const calls: FunctionCall[] | undefined = response.function_calls;
```

---

## Migration from OpenAIChatModel

If you're migrating from `@microsoft/teams.openai`, the API is nearly identical:

```typescript
// Before (OpenAI)
import { OpenAIChatModel } from '@microsoft/teams.openai';

const model = new OpenAIChatModel({
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
});

// After (Anthropic)
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';

const model = new AnthropicChatModel({
  model: AnthropicModel.CLAUDE_SONNET_4_5,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Usage is identical
const response = await model.send(message, options);
```

**Key Differences:**

1. **Model Selection**: Use `AnthropicModel` enum instead of strings
2. **API Key**: Use `ANTHROPIC_API_KEY` environment variable
3. **Request Options**: Some parameter names differ (see [AnthropicRequestOptions](#anthropicrequestoptions))

---

## Additional Resources

- [README.md](../README.md) - User documentation and examples
- [AGENTS.md](../AGENTS.md) - Developer documentation
- [Examples](../examples/) - Usage examples
- [Anthropic API Documentation](https://docs.anthropic.com/) - Official Anthropic API docs
- [Teams.ai Documentation](https://github.com/microsoft/teams-ai) - Microsoft Teams.ai framework docs
