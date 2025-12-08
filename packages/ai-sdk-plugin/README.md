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

### Prerequisites

- Bun >= 1.2.21 (or Node.js >= 18)
- You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys)
- MCP server running (see [MCP Server Setup](#mcp-server-setup))

### Installation

\`\`\`bash
# NPM
npm install @youdotcom-oss/ai-sdk-plugin ai

# Bun
bun add @youdotcom-oss/ai-sdk-plugin ai

# Yarn
yarn add @youdotcom-oss/ai-sdk-plugin ai
\`\`\`

### Quick example

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

## MCP Server Setup

This plugin requires a running MCP server. You have two options:

### Option 1: Use published MCP server (Recommended)

\`\`\`bash
# Install MCP server globally
bun add -g @youdotcom-oss/mcp

# Start server
YDC_API_KEY=your-key-here bun start @youdotcom-oss/mcp
\`\`\`

### Option 2: Run from source

\`\`\`bash
# Clone dx-toolkit
git clone https://github.com/youdotcom-oss/dx-toolkit.git
cd dx-toolkit

# Start MCP server
bun --cwd packages/mcp start
\`\`\`

The server runs on `http://localhost:4000/mcp` by default.

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

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## License

MIT - see [LICENSE](../../LICENSE) for details.
