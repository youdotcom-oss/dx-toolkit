# OpenAI Agents SDK Integration

**Integrate OpenAI Agents SDK with You.com MCP server for web search, AI agents, and content extraction.**

Get your OpenAI agent up and running with You.com's AI-powered capabilities in just a few steps. Supports both **Hosted MCP** (OpenAI-managed) and **Streamable HTTP** (self-managed) configurations for Python and TypeScript.

---

## What You Get

- 🤖 **Two configuration options**: Hosted MCP (recommended) or Streamable HTTP
- 🔍 **You.com web search** - Real-time search with filters
- 🧠 **You.com AI agent** - Fast AI responses with optional search
- 📄 **Content extraction** - Extract text from web pages
- 🐍 **Python support** - Full async/await pattern
- 📘 **TypeScript support** - Type-safe integration
- ✨ **Interactive setup** - Step-by-step guided workflow

---

## Installation

Get up and running in one command:

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --claude
```

**Option 2: Via marketplace**

First add the marketplace:
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
```

Then install the plugin:
```bash
/plugin install openai-agent-sdk-integration
```

**Use the plugin:**
```bash
/integrate-openai-agent
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --cursor
```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the plugin based on your project context.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s openai-agent-sdk-integration --agents.md
```

Your AI agent will automatically discover the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>

---

## Quick Start

After installation, trigger the integration workflow:

**Claude Code:**
```bash
/integrate-openai-agent
```

**Other AI agents:**
Ask your AI assistant: *"Integrate OpenAI Agents SDK with You.com"*

The workflow will guide you through:
1. **Language selection** - Python or TypeScript
2. **Configuration type** - Hosted MCP or Streamable HTTP
3. **Package installation** - Automatic setup
4. **Environment variables** - API key configuration
5. **File location** - New or existing file integration
6. **Code generation** - Complete working examples

---

## Configuration Options

### Hosted MCP (Recommended)

**What it is:** OpenAI manages the MCP connection through their infrastructure, while you provide authentication headers.

**Benefits:**
- ✅ Simpler configuration (no connection management)
- ✅ Lower latency (runs in OpenAI infrastructure)
- ✅ Automatic retries and error handling
- ✅ No connection lifecycle to manage

**Example:**
```python
from agents.mcp import HostedMCPTool

tools=[
    HostedMCPTool(
        tool_config={
            "server_label": "ydc",
            "server_url": "https://api.you.com/mcp",
            "headers": {
                "Authorization": f"Bearer {ydc_api_key}"
            },
        }
    )
]
```

### Streamable HTTP

**What it is:** You manage the MCP connection yourself.

**Benefits:**
- ✅ Full control over networking
- ✅ Custom headers and timeouts
- ✅ Run in your infrastructure
- ✅ Better for development/testing

**Example:**
```python
from agents.mcp import MCPServerStreamableHttp

async with MCPServerStreamableHttp(
    params={
        "url": "https://api.you.com/mcp",
        "headers": {"Authorization": f"Bearer {ydc_api_key}"},
    }
) as server:
    agent = Agent(mcp_servers=[server])
```

---

## Available Tools

Your AI agent gets access to:

### `you_search`
**Web and news search with filters**

Query: *"Search for the latest AI developments from this week"*

### `you_express`
**Fast AI agent with optional web search**

Query: *"What is the current GDP of Japan?"*

### `you_contents`
**Extract content from web pages**

Query: *"Extract content from https://example.com"*

---

## Complete Examples

### Python with Hosted MCP

```python
import os
import asyncio
from agents import Agent, Runner
from agents.mcp import HostedMCPTool

async def main():
    agent = Agent(
        name="AI News Assistant",
        instructions="Use You.com tools to search for AI news.",
        tools=[
            HostedMCPTool(
                tool_config={
                    "type": "mcp",
                    "server_label": "ydc",
                    "server_url": "https://api.you.com/mcp",
                    "headers": {
                        "Authorization": f"Bearer {os.environ['YDC_API_KEY']}"
                    },
                    "require_approval": "never",
                }
            )
        ],
    )
    
    result = await Runner.run(
        agent,
        "Search for the latest AI news from this week"
    )
    print(result.final_output)

asyncio.run(main())
```

### TypeScript with Hosted MCP

```typescript
import { Agent, run, hostedMcpTool } from '@openai/agents';

async function main() {
  const agent = new Agent({
    name: 'AI News Assistant',
    instructions: 'Use You.com tools to search for AI news.',
    tools: [
      hostedMcpTool({
        serverLabel: 'you',
        serverUrl: 'https://api.you.com/mcp',
        headers: {
          Authorization: `Bearer ${process.env.YDC_API_KEY}`,
        },
      }),
    ],
  });

  const result = await run(
    agent,
    'Search for the latest AI news from this week'
  );
  console.log(result.finalOutput);
}

main().catch(console.error);
```

---

## Environment Variables

Both API keys are required for both configuration modes:

```bash
export YDC_API_KEY="your-you-api-key-here"
export OPENAI_API_KEY="your-openai-api-key-here"
```

**Why both keys?**
- **YDC_API_KEY**: Authenticates requests to You.com MCP server (required in headers for both modes)
- **OPENAI_API_KEY**: Authenticates with OpenAI Agents SDK

**Get your API keys:**
- You.com: https://you.com/platform/api-keys
- OpenAI: https://platform.openai.com/api-keys

---

## Common Issues

<details>
<summary><strong>Cannot find module @openai/agents</strong></summary>

Install the package:

```bash
# NPM
npm install @openai/agents

# Bun
bun add @openai/agents

# Yarn
yarn add @openai/agents

# pnpm
pnpm add @openai/agents
```

</details>

<details>
<summary><strong>Missing API key error</strong></summary>

Set your API keys as environment variables:

```bash
export YDC_API_KEY="your-you-api-key-here"
export OPENAI_API_KEY="your-openai-api-key-here"
```

Get your keys:
- You.com: https://you.com/platform/api-keys
- OpenAI: https://platform.openai.com/api-keys

</details>

<details>
<summary><strong>MCP connection fails</strong></summary>

**For Hosted MCP:**
- Verify `server_url: "https://api.you.com/mcp"` is correct
- Check `server_label` matches your configuration
- **Ensure `headers` includes Authorization with Bearer token:**
  ```python
  "headers": {"Authorization": f"Bearer {ydc_api_key}"}
  ```
- Verify `require_approval` is set to `"never"`
- Confirm both YDC_API_KEY and OPENAI_API_KEY are set

**For Streamable HTTP:**
- Verify the URL `https://api.you.com/mcp` is correct
- Check Authorization header includes `Bearer` prefix
- Ensure MCP server is connected before creating agent
- Verify both YDC_API_KEY and OPENAI_API_KEY are valid

</details>

<details>
<summary><strong>Tools not being called</strong></summary>

Make sure you're using natural language queries that clearly indicate the need for the tools:

```python
# ✅ Good - clearly needs search
"Search for the latest AI news from this week"

# ❌ Bad - no clear tool trigger
"Tell me about AI"
```

Optionally, set `tool_choice="required"` to force tool use:

```python
from agents.model_settings import ModelSettings

agent = Agent(
    model_settings=ModelSettings(tool_choice="required"),
)
```

</details>

---

## Documentation

- **Command Workflow**: See `commands/integrate-openai-agent.md` for complete workflow details
- **OpenAI Agents SDK (Python)**: https://openai.github.io/openai-agents-python/
- **OpenAI Agents SDK (TypeScript)**: https://openai.github.io/openai-agents-js/
- **You.com MCP Server**: https://documentation.you.com/developer-resources/mcp-server

---

## Related Packages

- **[@youdotcom-oss/mcp](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp)** - You.com MCP server package
- **[Claude Agent SDK Integration](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/claude-agent-sdk-integration)** - Similar plugin for Claude Agent SDK

---

## License

MIT - See [LICENSE](./LICENSE) for details

---

**Built with ❤️ by [You.com](https://you.com)**
