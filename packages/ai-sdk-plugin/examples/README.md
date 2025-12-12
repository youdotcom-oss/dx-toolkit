# Examples

Usage examples for `@youdotcom-oss/ai-sdk-plugin`.

## Setup

### 1. Get API keys

Get your API keys from:
- **You.com**: [you.com/platform/api-keys](https://you.com/platform/api-keys)
- **Anthropic**: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

### 2. Set environment variables

You can either:

**Option A: Use the package `.env` file** (recommended for development):

```bash
cd packages/ai-sdk-plugin
cp .env.example .env
# Edit .env and add your keys
source .env
```

**Option B: Use the root `.env` file** (for running from monorepo root):

```bash
# From repository root
echo "export YDC_API_KEY=your-youdotcom-api-key-here" >> .env
echo "export ANTHROPIC_API_KEY=your-anthropic-api-key-here" >> .env
source .env
```

**Option C: Export directly** (for quick testing):

```bash
export YDC_API_KEY=your-youdotcom-api-key-here
export ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 3. Install dependencies

```bash
# From repository root
bun install
```

## Run examples

### Using the example script (recommended)

The easiest way to run examples from anywhere in the project:

```bash
# From package directory or repository root
bun run example              # Runs basic-search (default)
bun run example search       # Runs basic-search
bun run example agent        # Runs agent-response
bun run example extract      # Runs content-extraction
bun run example stream       # Runs streaming-text
bun run example error        # Runs error-handling
bun run example help         # Shows all available examples
```

### Direct execution

From the package directory:

```bash
cd packages/ai-sdk-plugin

# Basic web search
bun examples/basic-search.ts

# Streaming responses
bun examples/streaming-text.ts

# AI agent with web search
bun examples/agent-response.ts

# Content extraction
bun examples/content-extraction.ts

# Error handling
bun examples/error-handling.ts
```

Or from the repository root using Bun's `--cwd` flag:

```bash
bun --cwd packages/ai-sdk-plugin examples/basic-search.ts
bun --cwd packages/ai-sdk-plugin examples/streaming-text.ts
bun --cwd packages/ai-sdk-plugin examples/agent-response.ts
bun --cwd packages/ai-sdk-plugin examples/content-extraction.ts
bun --cwd packages/ai-sdk-plugin examples/error-handling.ts
```

## What's included

### basic-search.ts
Search the web for current information using `youSearch()`. Demonstrates:
- Environment variable validation
- Basic web search with tool integration
- Tool call inspection

### agent-response.ts
Fast AI agent responses with `youExpress()`. Demonstrates:
- AI-powered answers with web context
- Tool usage tracking
- Natural language queries

### content-extraction.ts
Extract web page content using `youContents()`. Demonstrates:
- URL content extraction
- Tool execution details
- Processing extracted content

### streaming-text.ts
Real-time streaming responses with `streamText()`. Demonstrates:
- Streaming text output
- Progressive response rendering
- Real-time tool execution

### error-handling.ts
Production-ready error handling patterns. Demonstrates:
- Environment variable validation
- Try-catch patterns
- Helpful error messages with solutions
- Graceful error recovery

## About these examples

### AI model provider

All examples use **Anthropic's Claude** (`claude-sonnet-4-5-20250929`) via the explicit provider pattern:

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: { search: youSearch() },
  prompt: 'Your query here',
});
```

**Why this pattern?**
- Explicit and self-documenting
- No global configuration required
- Clear dependency on `@ai-sdk/anthropic`
- Matches integration test patterns

### Using different providers

You can easily swap to other AI SDK providers:

```typescript
// OpenAI
import { openai } from '@ai-sdk/openai';
const result = await generateText({
  model: openai('gpt-4'),
  tools: { search: youSearch() },
  prompt: 'Your query',
});

// Google Gemini
import { google } from '@ai-sdk/google';
const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  tools: { search: youSearch() },
  prompt: 'Your query',
});
```

### Environment variables

All examples check for both API keys at runtime and provide helpful error messages if missing:

```bash
❌ Error: YDC_API_KEY environment variable is required
💡 Solution: Set your You.com API key
   export YDC_API_KEY=your-key-here
   Get a key at: https://you.com/platform/api-keys
```

### Testing

These examples serve as both:
- **Living documentation** - Shows real-world usage patterns
- **Integration validation** - Patterns verified by `src/tests/integration.spec.ts`

## Choose your tool

- **youSearch()** - Current web search results with snippets and news
- **youExpress()** - Quick AI answers powered by web search
- **youContents()** - Full page content extraction in markdown/HTML

## Troubleshooting

**Examples fail with "module not found":**
- Run `bun install` from repository root
- Verify you're in the correct directory

**API key errors:**
- Check environment variables are set: `echo $YDC_API_KEY`
- Verify keys are valid at provider dashboards
- Try sourcing `.env` again: `source .env`

**Rate limit errors (429):**
- Wait a few minutes before retrying
- Check API usage limits in provider dashboards
