# Microsoft Teams MCP Integration

**Integrate Microsoft Teams applications with You.com MCP server using the `@youdotcom-oss/teams-anthropic` package.**

Get your Teams app up and running with You.com's MCP server in just a few steps. This plugin guides you through installation, template integration, and environment configuration - whether you're creating a new Teams app or adding to an existing one.

---

## What You Get

- 🚀 **Guided package installation** - Orchestrates `@youdotcom-oss/teams-anthropic` setup
- 🔀 **Smart integration flow** - New app vs existing app decisions
- 📝 **Template-based setup** - Clear inline markers for easy copying
- ⚙️ **Environment configuration** - API key setup guidance
- 🤖 **MCP client integration** - You.com web search, AI agent, and content extraction
- 🌐 **Cross-platform support** - Works with Claude Code, Cursor, and all AI coding assistants

---

## Installation

Get up and running in one command:

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude
```

**Option 2: Via marketplace**

First add the marketplace:
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
```

Then install the plugin:
```bash
/plugin install teams-anthropic-integration
```

**Use the plugin:**
```bash
/generate-teams-app
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor
```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the plugin.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents
```

Your AI agent will automatically discover skills by scanning the `.agents/skills/` directory.

Learn more: [agents.md specification](https://agents.md/)

</details>

---

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

## Troubleshooting

<details>
<summary><strong>Cannot find module @youdotcom-oss/teams-anthropic</strong></summary>

The plugin should have installed it automatically. If not, run:

```bash
# NPM
npm install @youdotcom-oss/teams-anthropic

# Bun
bun add @youdotcom-oss/teams-anthropic

# Yarn
yarn add @youdotcom-oss/teams-anthropic

# pnpm
pnpm add @youdotcom-oss/teams-anthropic
```

Also ensure you have the required dependencies:
```bash
npm install @microsoft/teams.ai @microsoft/teams.mcpclient
```

</details>

<details>
<summary><strong>API key not recognized</strong></summary>

Ensure your environment variables are set correctly:

```bash
export YDC_API_KEY="your-you-api-key-here"
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

Get your keys:
- You.com: https://you.com/platform/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

</details>

<details>
<summary><strong>MCP connection fails</strong></summary>

Check:
1. YDC_API_KEY is set and valid
2. `getYouMcpConfig()` is properly configured in ChatPrompt
3. Authorization header uses Bearer token format
4. Network connectivity to https://api.you.com/mcp

Verify your key at https://you.com/platform/api-keys

</details>

<details>
<summary><strong>Import error for App module</strong></summary>

For **existing apps**, skip the App import (line 20 in template):

```typescript
// ❌ Skip this line for existing apps
import { App } from '@microsoft/teams.apps';

// ✅ Use these imports instead
import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';
import { ChatPrompt, Logger } from '@microsoft/teams.ai';
import { McpClientPlugin, getYouMcpConfig } from '@microsoft/teams.mcpclient';
```

</details>

<details>
<summary><strong>Missing dependencies</strong></summary>

Install all required packages:

```bash
npm install @youdotcom-oss/teams-anthropic @microsoft/teams.ai @microsoft/teams.mcpclient
```

For existing Teams apps, you may already have `@microsoft/teams.ai` installed.

</details>

## Documentation

- **Plugin Skill**: https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/teams-anthropic-integration/skills
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
