# Microsoft Teams integration library for You.com's MCP server

TypeScript helper library that enables Microsoft Teams bots to seamlessly connect to You.com's Model Context Protocol (MCP) server for real-time web search, AI-powered answers, and content extraction capabilities.

## Features

- **Simple Integration**: One-line setup to connect Teams bots to You.com's MCP server
- **Remote MCP Server**: No hosting required - connects to production server at `https://api.you.com/mcp`
- **Service Account Auth**: Secure API key-based authentication
- **TypeScript First**: Full type safety with exported interfaces
- **Minimal Dependencies**: Only 3 required packages

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

## Documentation

For detailed API documentation, see [docs/API.md](./docs/API.md).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Development

See [AGENTS.md](./AGENTS.md) for development setup, architecture, and patterns.

## License

MIT - see [LICENSE](../../LICENSE) for details.
