# Claude Agent SDK Integration

**Guided setup for integrating Claude Agent SDK with You.com's HTTP MCP server.**

Get Claude agents working with You.com's web search, AI agent, and content extraction tools in minutes - supporting Python, TypeScript v1, and TypeScript v2 (preview).

---

## What This Plugin Does

This plugin helps you integrate the Claude Agent SDK with You.com's MCP server through an interactive workflow that:

✅ **Guides language selection** - Choose Python or TypeScript  
✅ **Handles SDK versioning** - TypeScript v1 (stable) or v2 (preview)  
✅ **Configures HTTP MCP** - Sets up You.com's remote MCP server  
✅ **Provides working templates** - Copy-paste ready code examples  
✅ **Validates setup** - Ensures environment variables and tools are configured

---

## Installation

Get up and running in one command:

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --claude
```

**Option 2: Via marketplace**

First add the marketplace:
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
```

Then install the plugin:
```bash
/plugin install claude-agent-sdk-integration
```

**Use the plugin:**
```bash
/integrate-claude-agent
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --cursor
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
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --agents.md
```

Your AI agent will automatically discover the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>

---

## Quick Start

After installation, run the integration command:

**Claude Code:**
```bash
/integrate-claude-agent
```

**Other AI Agents:**
Tell your agent: *"Integrate Claude Agent SDK with You.com MCP"*

The plugin will guide you through:
1. Language selection (Python or TypeScript)
2. SDK version selection (TypeScript only: v1 or v2)
3. Package installation
4. Environment variable setup
5. Template selection and file creation

---

## What You Get

### Python Template
```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    mcp_servers={
        "ydc": {
            "type": "http",
            "url": "https://api.you.com/mcp",
            "headers": {
                "Authorization": f"Bearer {os.getenv('YDC_API_KEY')}"
            }
        }
    },
    allowed_tools=["mcp__ydc__you_search", "mcp__ydc__you_express"]
)

async for message in query(prompt="Search for latest AI news", options=options):
    print(message)
```

### TypeScript v1 Template (Stable)
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: 'Search for latest AI news',
  options: {
    mcpServers: {
      ydc: {
        type: 'http' as const,
        url: 'https://api.you.com/mcp',
        headers: { Authorization: `Bearer ${process.env.YDC_API_KEY}` }
      }
    },
    allowedTools: ['mcp__ydc__you_search', 'mcp__ydc__you_express']
  }
});

for await (const msg of result) {
  console.log(msg);
}
```

### TypeScript v2 Template (Preview)
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk';

await using session = unstable_v2_createSession({
  mcpServers: {
    ydc: {
      type: 'http' as const,
      url: 'https://api.you.com/mcp',
      headers: { Authorization: `Bearer ${process.env.YDC_API_KEY}` }
    }
  },
  allowedTools: ['mcp__ydc__you_search', 'mcp__ydc__you_express']
});

await session.send('Search for latest AI news');
for await (const msg of session.receive()) {
  console.log(msg);
}
```

---

## Available You.com Tools

After integration, your Claude agents can use:

### `mcp__ydc__you_search`
Web and news search with filters (freshness, country, count)

**Example queries:**
- "Search for latest AI developments"
- "Find news about renewable energy from this week"
- "Search for Python tutorials"

### `mcp__ydc__you_express`
Fast AI agent with optional web search

**Example queries:**
- "What is the current GDP of Japan?"
- "Explain quantum computing"
- "Compare TypeScript and JavaScript"

### `mcp__ydc__you_contents`
Extract content from web pages

**Example queries:**
- "Extract content from https://example.com"
- "Get the text from these URLs: [url1, url2]"

---

## Prerequisites

### Required
- **Python users**: Python 3.8+ and pip
- **TypeScript users**: Node.js 18+ and npm (or bun/yarn/pnpm)
- **TypeScript v2 users**: TypeScript 5.2+ for `await using` support

### API Keys
You'll need two API keys (the plugin will guide you to get them):

1. **You.com API Key** - Get at [you.com/platform/api-keys](https://you.com/platform/api-keys)
2. **Anthropic API Key** - Get at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

## Troubleshooting

<details>
<summary><strong>Cannot find module claude-agent-sdk or @anthropic-ai/claude-agent-sdk</strong></summary>

The plugin should have installed it automatically. If not, run:

**Python:**
```bash
pip install claude-agent-sdk
```

**TypeScript:**
```bash
# NPM
npm install @anthropic-ai/claude-agent-sdk

# Bun
bun add @anthropic-ai/claude-agent-sdk

# Yarn
yarn add @anthropic-ai/claude-agent-sdk

# pnpm
pnpm add @anthropic-ai/claude-agent-sdk
```

</details>

<details>
<summary><strong>API key not recognized</strong></summary>

Ensure your environment variables are set correctly:

```bash
export YDC_API_KEY="your-you-api-key-here"
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

Verify keys are valid:
- You.com: https://you.com/platform/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

</details>

<details>
<summary><strong>MCP connection fails</strong></summary>

Check:
1. YDC_API_KEY is set and valid
2. Authorization header format is correct: `Bearer ${YDC_API_KEY}`
3. Network connectivity to https://api.you.com/mcp
4. No firewall blocking HTTPS connections

</details>

<details>
<summary><strong>Tools not available</strong></summary>

Ensure `allowedTools` includes correct tool names with `mcp__ydc__` prefix:
- `mcp__ydc__you_search` (not `you_search`)
- `mcp__ydc__you_express` (not `you_express`)
- `mcp__ydc__you_contents` (not `you_contents`)

</details>

<details>
<summary><strong>TypeScript error: Cannot use 'await using'</strong></summary>

The v2 SDK requires TypeScript 5.2+. Options:

**Option 1: Update TypeScript**
```bash
npm install -D typescript@latest
```

**Option 2: Use manual cleanup**
```typescript
const session = unstable_v2_createSession({ /* options */ });
try {
  // Use session
} finally {
  session.close();
}
```

**Option 3: Use v1 SDK**
Choose v1 during plugin setup for broader compatibility.

</details>

---

## Examples

### Multi-Turn Conversation (TypeScript v2)

```typescript
await using session = unstable_v2_createSession({
  mcpServers: { ydc: { /* config */ } },
  allowedTools: ['mcp__ydc__you_search', 'mcp__ydc__you_express']
});

// Turn 1
await session.send('What are the latest AI developments?');
for await (const msg of session.receive()) {
  console.log(msg);
}

// Turn 2 - Claude remembers context
await session.send('Tell me more about the first one');
for await (const msg of session.receive()) {
  console.log(msg);
}
```

### Combining Multiple Tools (Python)

```python
options = ClaudeAgentOptions(
    mcp_servers={"ydc": { /* config */ }},
    allowed_tools=[
        "mcp__ydc__you_search",    # For finding URLs
        "mcp__ydc__you_contents"   # For extracting content
    ]
)

async for message in query(
    prompt="Find articles about AI ethics and extract their content",
    options=options
):
    print(message)
```

---

## Additional Resources

* **You.com MCP Server**: https://documentation.you.com/developer-resources/mcp-server
* **Claude Agent SDK (Python)**: https://platform.claude.com/docs/en/agent-sdk/python
* **Claude Agent SDK (TypeScript v1)**: https://platform.claude.com/docs/en/agent-sdk/typescript
* **Claude Agent SDK (TypeScript v2)**: https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview
* **Plugin Command Reference**: `commands/integrate-claude-agent.md`

---

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **API Keys**: [You.com Platform](https://you.com/platform/api-keys)
- **Email**: support@you.com

---

**Built with ❤️ by [You.com](https://you.com)**
