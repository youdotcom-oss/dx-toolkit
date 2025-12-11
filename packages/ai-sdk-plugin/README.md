# Vercel AI SDK plugin for You.com

Integrate You.com's web search, AI agents, and content extraction capabilities into your Vercel AI SDK applications via Model Context Protocol (MCP).

## Features

- **Web Search** (`you-search`) - Search the web using You.com's search API with real-time results
- **AI Agent** (`you-express`) - Fast AI responses with optional web search integration
- **Content Extraction** (`you-contents`) - Extract full page content in markdown or HTML format
- Full TypeScript support with type safety
- Automatic tool discovery via MCP
- Production-ready HTTP transport

## Getting started

Get up and running with You.com AI SDK plugin in 4 quick steps. No complex configuration needed - just install, start the server, and search!

### 1. Get your API key

Sign up at [you.com/platform/api-keys](https://you.com/platform/api-keys) to get your free API key.

### 2. Install the package

Choose your preferred package manager:

\`\`\`bash
# NPM
npm install @youdotcom-oss/ai-sdk-plugin ai

# Bun
bun add @youdotcom-oss/ai-sdk-plugin ai

# Yarn
yarn add @youdotcom-oss/ai-sdk-plugin ai
\`\`\`

### 3. Start the MCP server

This plugin connects to an MCP server. Choose your setup:

**Quick start (recommended):**

\`\`\`bash
# Install and start MCP server globally
bun add -g @youdotcom-oss/mcp
YDC_API_KEY=your-key-here bun start @youdotcom-oss/mcp
\`\`\`

<details>
<summary>Or run from source</summary>

\`\`\`bash
# Clone repository
git clone https://github.com/youdotcom-oss/dx-toolkit.git
cd dx-toolkit

# Start MCP server
YDC_API_KEY=your-key-here bun --cwd packages/mcp start
\`\`\`
</details>

The server runs on `http://localhost:4000/mcp` by default.

### 4. Test your setup

Try this simple search example:

\`\`\`typescript
import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const { tools, close } = await createYouMCPClient({
  apiKey: process.env.YDC_API_KEY,
});

try {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools,
    maxSteps: 5,
    prompt: 'Search for the latest AI developments',
  });

  console.log(result.text);
} finally {
  await close();
}
\`\`\`

## Configuration

### API Options

\`\`\`typescript
export type YouMCPClientConfig = {
  apiKey?: string;              // You.com API key (or use YDC_API_KEY env var)
  serverUrl?: string;           // Default: 'http://localhost:4000/mcp'
  headers?: Record<string, string>;
  clientName?: string;          // Default: 'youdotcom-ai-sdk-plugin'
  onUncaughtError?: (error: unknown) => void;
};
\`\`\`

### Environment Variables

- `YDC_API_KEY` - Your You.com API key (required if not provided in config)

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
