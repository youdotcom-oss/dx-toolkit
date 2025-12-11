# Examples

Usage examples for `@youdotcom-oss/ai-sdk-plugin`.

## Setup

Get your API keys from [You.com](https://you.com/platform/api-keys) and [Anthropic](https://console.anthropic.com/settings/keys), then:

```bash
cp .env.example .env
# Edit .env and add your keys
source .env
bun install
```

## Run Examples

\`\`\`bash
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
\`\`\`

## What's Included

**basic-search.ts** - Search the web for current information using `youSearch`

**agent-response.ts** - Fast AI agent responses with `youExpress`

**content-extraction.ts** - Extract web page content using `youContents`

**streaming-text.ts** - Real-time streaming responses with `streamText()`

**error-handling.ts** - Graceful error handling patterns

## About These Examples

These examples serve as both living documentation and test scenarios. The integration tests in `../src/tests/integration.spec.ts` validate that these examples work correctly with real API calls.

## Choose Your Tool

- **youSearch** - Current web search results with snippets and news
- **youExpress** - Quick AI answers powered by web search
- **youContents** - Full page content extraction in markdown/HTML
