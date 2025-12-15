# You.com Plugin Marketplace

Browse and install plugins that bring You.com's AI capabilities to your development workflow. Works with Claude Code, Cursor, Windsurf, and other AI coding assistants.

---

## 🚀 Quick Start

Choose your platform to get started:

<details>
<summary><strong>Claude Code</strong> (Native Support)</summary>

```bash
# Add marketplace
/plugin marketplace add youdotcom-oss/dx-toolkit

# Browse plugins
/plugin list

# Install a plugin
/plugin install teams-mcp-integration

# Use it
/generate-teams-app
```

</details>

<details>
<summary><strong>Agent SDK</strong> (Programmatic)</summary>

**Quick Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration
```

**Manual Install:**
```bash
# Download plugin archive
curl -L https://github.com/youdotcom-oss/dx-toolkit/releases/latest/download/teams-mcp-integration-v1.0.0.tar.gz | tar -xz -C ./plugins/
```

**Usage in code:**
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Hello",
  options: {
    plugins: [
      { type: "local", path: "./plugins/teams-mcp-integration" }
    ]
  }
})) {
  // Plugin features available
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

**Quick Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration
```

Then copy AGENTS.md to Cursor rules:
```bash
cp .cursor/plugins/teams-mcp-integration/AGENTS.md .cursor/rules/teams-mcp-integration.md
```

Enable in: Cursor Settings → Rules → Import Settings → "Claude skills and plugins"

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Windsurf</strong></summary>

**Quick Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration
```

Then copy AGENTS.md to Windsurf rules:
```bash
cp .windsurf/plugins/teams-mcp-integration/AGENTS.md .windsurf/rules/teams-mcp-integration.md
```

</details>

<details>
<summary><strong>Other AI Agents</strong> (Cody, Continue, etc.)</summary>

**Quick Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration
```

**Or download directly:**
```bash
curl -L https://github.com/youdotcom-oss/dx-toolkit/releases/latest/download/teams-mcp-integration-v1.0.0.tar.gz | tar -xz
```

Your AI agent will automatically discover and use the instructions in `AGENTS.md`.

</details>

---

## 📦 Available Plugins

### Enterprise Integration

<details open>
<summary><strong>teams-mcp-integration</strong> v1.0.0</summary>

**Integrate Microsoft Teams apps with You.com MCP server**

Get your Teams app up and running with You.com's AI-powered search in 4 quick steps. Supports both new and existing Teams applications.

**What you get:**
- 🤖 Claude Sonnet 4.5 integration for Teams
- 🔍 You.com web search capabilities
- 📝 Step-by-step setup workflow
- 🔀 Works with new or existing Teams apps
- ⚡ Template-based integration with clear markers

**Quick Install:**
```bash
# Claude Code
/plugin install teams-mcp-integration

# Agent SDK / Other IDEs
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration

# Manual Download
curl -L https://github.com/youdotcom-oss/dx-toolkit/releases/latest/download/teams-mcp-integration-v1.0.0.tar.gz | tar -xz -C ./plugins/
```

**Package:** [`@youdotcom-oss/teams-anthropic`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic)

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/teams-mcp-integration)
- [Package README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=teams-mcp-integration)
- [You.com MCP Server](https://documentation.you.com/developer-resources/mcp-server)

</details>

---

## 🎯 Categories

**Enterprise Integration**
Framework integrations for enterprise platforms (Microsoft Teams, Google Chat, Slack)

**Workflow**
AI workflow generators (RAG, evaluation harness, RL pipeline)

**Deployment**
Cloud deployment and infrastructure automation (GCP, Azure, Databricks)

---

## 💡 How Plugins Work

**For Claude Code users:**
- Plugins add slash commands to your workflow
- Native integration with your IDE
- Automatic updates and version management

**For other AI agents:**
- Plugins provide AGENTS.md instructions
- Your AI assistant reads and follows the workflow
- Same capabilities, universal compatibility

**All platforms:**
- Access official You.com packages
- Step-by-step setup guidance
- Environment configuration help
- Troubleshooting support

---

## 🆘 Support

**Need help?**
- Browse [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- Read [dx-toolkit README](https://github.com/youdotcom-oss/dx-toolkit)
- Email: support@you.com

**Get API keys:**
- [You.com Platform](https://you.com/platform/api-keys)
- [Anthropic Console](https://console.anthropic.com/)

---

## 🔗 Related

- [Root README](../README.md) - Project overview and packages
- [MCP Server Package](../packages/mcp/) - You.com MCP server
- [AI SDK Plugin](../packages/ai-sdk-plugin/) - Vercel AI SDK integration
- [Teams Integration](../packages/teams-anthropic/) - Microsoft Teams.ai SDK

---

<details>
<summary><strong>For Plugin Developers</strong></summary>

Want to contribute or build your own plugin? See:
- [Root AGENTS.md](../AGENTS.md) - Development guidelines
- [marketplace.json](../marketplace.json) - Marketplace manifest
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute

</details>
