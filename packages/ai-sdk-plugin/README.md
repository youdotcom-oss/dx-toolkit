# Vercel AI SDK plugin for You.com

Integrate You.com's web search, AI agents, and content extraction capabilities into your Vercel AI SDK applications.

## Features

- **Web Search** (`youSearch`) - Search the web using You.com's search API with real-time results
- **AI Agent** (`youExpress`) - Fast AI responses with optional web search integration
- **Content Extraction** (`youContents`) - Extract full page content in markdown or HTML format
- Full TypeScript support with type safety
- Simple API with no server setup required

## Getting started

Get up and running in 3 quick steps:

### 1. Get your API key

Sign up at [you.com/platform/api-keys](https://you.com/platform/api-keys) to get your free API key.

### 2. Install the package

\`\`\`bash
# NPM
npm install @youdotcom-oss/ai-sdk-plugin ai

# Bun
bun add @youdotcom-oss/ai-sdk-plugin ai

# Yarn
yarn add @youdotcom-oss/ai-sdk-plugin ai
\`\`\`

### 3. Use the tools

\`\`\`typescript
import { generateText } from 'ai';
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  tools: {
    search: youSearch(),
    agent: youExpress(),
    extract: youContents(),
  },
  maxSteps: 5,
  prompt: 'Search for the latest AI developments',
});

console.log(result.text);
\`\`\`

That's it! Your agent will automatically use the tools when needed.

## Configuration

Each tool accepts an optional configuration object:

\`\`\`typescript
export type YouToolsConfig = {
  apiKey?: string;  // You.com API key (defaults to YDC_API_KEY env var)
};
\`\`\`

### Environment Variables

Set your API key as an environment variable:

\`\`\`bash
export YDC_API_KEY=your-api-key-here
\`\`\`

Or pass it directly to the tools:

\`\`\`typescript
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const search = youSearch({
  apiKey: 'your-api-key-here',
});
\`\`\`

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

## Examples

See the `examples/` directory for more usage examples:

- `examples/basic-search.ts` - Basic web search
- `examples/streaming-text.ts` - Streaming responses
- `examples/agent-response.ts` - AI agent with web search
- `examples/content-extraction.ts` - Extract web page content
- `examples/error-handling.ts` - Comprehensive error handling

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## License

MIT - see [LICENSE](../../LICENSE) for details.
