# Microsoft Teams MCP Integration Plugin

Integrate Microsoft Teams applications with You.com MCP server using the [`@youdotcom-oss/teams-anthropic`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic) package.

## Overview

This Claude Code plugin helps you quickly set up Microsoft Teams apps with You.com MCP server integration. It guides you through package installation, template copying, and environment configuration - whether you're creating a new Teams app or integrating into an existing one.

## Features

- 🚀 Orchestrates package installation (`@youdotcom-oss/teams-anthropic`)
- 🔀 Guides new app vs existing app setup decisions
- 📝 Template-based integration with clear inline markers
- ⚙️ Environment configuration guidance
- 🌐 Works across all AI coding platforms

## Installation

### Claude Code Users

```bash
# Add marketplace
/plugin marketplace add youdotcom-oss/dx-toolkit

# Install plugin
/plugin install teams-mcp-integration

# Use slash command
/generate-teams-app
```

### Cursor Users

Download AGENTS.md to your project's Cursor rules directory:

```bash
curl -o teams-mcp-integration.md https://api.you.com/plugins/teams-mcp-integration/AGENTS.md
mv teams-mcp-integration.md .cursor/rules/
```

Then enable in Cursor Settings → Rules → Import Settings → "Claude skills and plugins"

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

### Windsurf Users

Download AGENTS.md to your project's Windsurf rules directory:

```bash
curl -o teams-mcp-integration.md https://api.you.com/plugins/teams-mcp-integration/AGENTS.md
mv teams-mcp-integration.md .windsurf/rules/
```

### Other AI Agents (Cody, Continue, etc.)

Download AGENTS.md to your project root:

```bash
curl -o AGENTS.md https://api.you.com/plugins/teams-mcp-integration/AGENTS.md
```

AI agents will automatically discover and use it.

### Manual Usage

Access documentation directly:

```bash
# View instructions
curl https://api.you.com/plugins/teams-mcp-integration/AGENTS.md

# View README
curl https://api.you.com/plugins/teams-mcp-integration/README.md

# Install package and access template
npm install @youdotcom-oss/teams-anthropic
# Template location: node_modules/@youdotcom-oss/teams-anthropic/templates/mcp-client.ts
```

## Quick Start

### Prerequisites

- You.com API key: https://you.com/platform/api-keys
- Anthropic API key: https://console.anthropic.com/

### Integration Steps

1. **Install the package**
   ```bash
   npm install @youdotcom-oss/teams-anthropic @microsoft/teams.ai @microsoft/teams.mcpclient
   ```

2. **Copy the template**
   * Template location: `node_modules/@youdotcom-oss/teams-anthropic/templates/mcp-client.ts`
   * For new apps: Copy entire file
   * For existing apps: Follow inline markers (EXISTING APP comments)

3. **Configure environment**
   ```bash
   # Create .env file
   echo "YDC_API_KEY=your-you-api-key" > .env
   echo "ANTHROPIC_API_KEY=your-anthropic-api-key" >> .env
   ```

4. **Integrate ChatPrompt**
   * Use AnthropicChatModel with Claude Sonnet 4.5
   * Configure McpClientPlugin
   * Connect to `https://api.you.com/mcp`
   * Use Bearer token authentication

## Template Structure

The template has four clear sections with inline markers:

1. **Imports** (lines 16-25)
   * NEW APP: Copy all imports
   * EXISTING APP: Skip line 20 (App import), copy lines 21-25

2. **Environment & Configuration** (lines 27-45)
   * ALL APPS: Copy this section
   * Validates API keys
   * Configures logger and instructions

3. **ChatPrompt Setup** (lines 47-74)
   * ALL APPS: Copy this section (core integration)
   * AnthropicChatModel configuration
   * MCP client plugin setup
   * You.com MCP server connection

4. **Teams App Setup** (lines 76-93)
   * NEW APP: Copy this section
   * EXISTING APP: Skip this section (you have your own app)

## Common Issues

### Cannot find module @youdotcom-oss/teams-anthropic

Run `npm install @youdotcom-oss/teams-anthropic`

### YDC_API_KEY environment variable is required

Add to .env file: `YDC_API_KEY=your-key-here`

Get your key at https://you.com/platform/api-keys

### ANTHROPIC_API_KEY environment variable is required

Add to .env file: `ANTHROPIC_API_KEY=your-key-here`

Get your key at https://console.anthropic.com/

### MCP connection fails

Verify your API key is valid at https://you.com/platform/api-keys

### Import error for App from @microsoft/teams.apps

For existing apps, skip the App import (line 20 in template)

## Documentation

- **Plugin AGENTS.md**: https://api.you.com/plugins/teams-mcp-integration/AGENTS.md
- **Package README**: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic
- **Package API Docs**: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic/docs/API.md
- **You.com MCP Server**: https://documentation.you.com/developer-resources/mcp-server

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
- **API Keys**: https://you.com/platform/api-keys

## License

MIT - See [LICENSE](./LICENSE)

## Related

- [`@youdotcom-oss/teams-anthropic`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic) - The npm package this plugin orchestrates
- [`@youdotcom-oss/mcp`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp) - You.com MCP server
- [Marketplace Documentation](https://github.com/youdotcom-oss/dx-toolkit/tree/main/docs/MARKETPLACE.md)
