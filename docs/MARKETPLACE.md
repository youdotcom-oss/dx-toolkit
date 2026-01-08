# You.com Skills Marketplace

Browse and install skills that bring You.com's AI capabilities to your development workflow. Works with Claude Code, Cursor, Windsurf, and other AI coding assistants.

---

## 🚀 Quick Start

Choose your platform to get started:

<details>
<summary><strong>Claude Code</strong> (Native Support)</summary>

**Option 1: Via Install Script (Recommended)**

The install script automatically configures the marketplace in `.claude/settings.json`:

```bash
# Run from your project directory
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration

# Restart Claude Code, then use:
/generate-teams-app
```

**Option 2: Manual Configuration**

Add marketplace to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "youdotcom-dx-toolkit": {
      "source": {
        "source": "github",
        "repo": "youdotcom-oss/dx-toolkit"
      }
    }
  }
}
```

Then use Claude Code commands:

```bash
# Browse available plugins
/plugin list

# Install a plugin
/plugin install teams-anthropic-integration

# Use it
/generate-teams-app
```

See [Configure Team Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces#configure-team-marketplaces)

</details>

<details>
<summary><strong>Cursor</strong> (Imports from Claude)</summary>

Cursor imports from Claude's skills and plugins system, so plugins install to `.claude/plugins/`:

```bash
# Install plugin
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor

# Then enable in Cursor
# Settings → Rules → Import Settings → Toggle "Claude skills and plugins"
```

Cursor determines when plugins are relevant based on context (agent-decided rules).

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong> (Universal via agents.md)</summary>

**For Cody, Continue, Codex, Jules, and 20+ other AI agents:**

The install script automatically adds the plugin reference to your project's `AGENTS.md`:

```bash
# Install and configure
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents.md

# Optional: Custom directory (default: .dx-toolkit)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents.md --dir .plugins
```

Your AI agent will automatically discover and use the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>

---

## 📦 Available Skills

### Enterprise Integration

<details open>
<summary><strong>teams-anthropic-integration</strong></summary>

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
/plugin install teams-anthropic-integration
# Or: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents.md
```

**Package:** [`@youdotcom-oss/teams-anthropic`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic)

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/teams-anthropic-integration)
- [Package README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=teams-anthropic-integration)
- [You.com MCP Server](https://documentation.you.com/developer-resources/mcp-server)

</details>

### Workflow

<details open>
<summary><strong>ai-sdk-integration</strong></summary>

**Integrate Vercel AI SDK with You.com tools**

Add You.com's search, AI agent, and content extraction capabilities to your Vercel AI SDK applications. Works with both `generateText()` and `streamText()` patterns.

**What you get:**
- 🚀 Interactive setup workflow
- 🛠️ Three powerful tools: web search, AI agent, content extraction
- ⚙️ Smart integration with existing files or new templates
- 📝 Support for both generateText and streamText patterns
- 🌐 Universal compatibility across AI coding assistants

**Quick Install:**
```bash
# Claude Code
/plugin install ai-sdk-integration
# Or: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --agents.md
```

**Package:** [`@youdotcom-oss/ai-sdk-plugin`](https://www.npmjs.com/package/@youdotcom-oss/ai-sdk-plugin)

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/ai-sdk-integration)
- [Package README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/ai-sdk-plugin)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=ai-sdk-integration)

</details>

<details open>
<summary><strong>claude-agent-sdk-integration</strong></summary>

**Integrate Claude Agent SDK with You.com MCP server**

Set up Claude Agent SDK with You.com's HTTP MCP server for web search, AI agents, and content extraction. Supports Python and TypeScript with complete working examples.

**What you get:**
- 🐍 Python async/await pattern
- 📘 TypeScript type-safe integration
- 🔌 HTTP MCP server configuration
- 🔍 You.com search, AI agent, and content tools
- ✨ Interactive setup workflow
- 📝 Complete template examples

**Quick Install:**
```bash
# Claude Code
/plugin install claude-agent-sdk-integration
# Or: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --agents.md
```

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/claude-agent-sdk-integration)
- [Claude Agent SDK (Python)](https://platform.claude.com/docs/en/agent-sdk/python)
- [Claude Agent SDK (TypeScript)](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=claude-agent-sdk-integration)

</details>

<details open>
<summary><strong>openai-agent-sdk-integration</strong></summary>

**Integrate OpenAI Agents SDK with You.com MCP server**

Set up OpenAI Agents SDK with You.com MCP server using Hosted MCP (OpenAI-managed) or Streamable HTTP (self-managed). Supports Python and TypeScript with flexible configuration options.

**What you get:**
- 🤖 Two configuration modes: Hosted MCP and Streamable HTTP
- 🐍 Python async/await pattern
- 📘 TypeScript type-safe integration
- 🔍 You.com search, AI agent, and content tools
- ✨ Interactive setup workflow
- 📝 Complete template examples for both modes

**Quick Install:**
```bash
# Claude Code
/plugin install openai-agent-sdk-integration
# Or: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --agents.md
```

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/openai-agent-sdk-integration)
- [OpenAI Agents SDK (Python)](https://openai.github.io/openai-agents-python/)
- [OpenAI Agents SDK (TypeScript)](https://openai.github.io/openai-agents-js/)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=openai-agent-sdk-integration)

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

## 💡 How Skills Work

**For Claude Code users (--claude):**
- Skills provide interactive workflows for integration tasks
- Install script automatically configures `.claude/settings.json` with marketplace
- Local installation to `.claude/plugins/` for project isolation and security
- Native integration with your IDE
- Restart Claude Code to use installed skills

**For Cursor users (--cursor):**
- Cursor imports from [Claude's skills and plugins](https://cursor.com/docs/context/rules#claude-skills-and-plugins)
- Install to `.claude/plugins/` (same location as Claude Code)
- Enable in: Cursor Settings → Rules → Import Settings → "Claude skills and plugins"
- Cursor determines when skills are relevant based on context (agent-decided rules)
- No manual file copying required

**For other AI agents (--agents.md):**
- Install to `.dx-toolkit/plugins/` (customizable via `--dir`)
- Script automatically adds reference to your project's `AGENTS.md`
- AI agents discover skills via marketplace.json and directory scan
- Works with Claude, Codex, Jules, Cody, Continue, VS Code, and 20+ agents
- Universal compatibility via [agents.md specification](https://agents.md/)

**All platforms:**
- Access official You.com packages
- Step-by-step setup guidance via interactive workflows
- Environment configuration help
- Troubleshooting support

**Learn more:**
- [agents.md specification](https://agents.md/)
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

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
<summary><strong>For Skill Developers</strong></summary>

Want to contribute or build your own skill? See:
- [Root AGENTS.md](../AGENTS.md) - Development guidelines
- [marketplace.json](../marketplace.json) - Marketplace manifest
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute

</details>
