# Vercel AI SDK Integration with You.com

Add You.com's search, AI agent, and content extraction tools to your Vercel AI SDK applications. This plugin guides you through integrating the [`@youdotcom-oss/ai-sdk-plugin`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/ai-sdk-plugin) package into your existing AI SDK setup - whether you use `generateText()` or `streamText()`.

## What you get

- 🚀 **Interactive setup workflow** - Answer a few questions, get working code
- 🛠️ **Three powerful tools** - Web search, AI agent with web context, content extraction
- ⚙️ **Smart integration** - Works with your existing files or creates new ones
- 📝 **Template guidance** - Clear examples for both generateText and streamText patterns
- 🌐 **Universal compatibility** - Works across Claude Code, Cursor, and 20+ other AI agents

## Installation

Get up and running in one command:

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --claude
```

**Option 2: Via marketplace**

First add the marketplace:
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
```

Then install the plugin:
```bash
/plugin install ai-sdk-integration
```

**Use the plugin:**
```bash
/integrate-ai-sdk
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
# Install plugin
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --cursor
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
# Install and configure
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --agents.md
```

Your AI agent will automatically discover the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>

## How it works

The plugin asks you simple questions to understand your setup:

1. **Which package manager?** - npm, bun, yarn, or pnpm
2. **Environment variable name?** - Standard `YDC_API_KEY` or custom name
3. **Which AI SDK functions?** - `generateText()`, `streamText()`, or both
4. **New or existing files?** - Integrate into current code or create new files
5. **Which tools?** - Choose from youSearch, youExpress, youContents

Then it generates the integration code for you.

## Prerequisites

You'll need:
- **You.com API key** - Get yours at [you.com/platform/api-keys](https://you.com/platform/api-keys)
- **AI SDK provider set up** - Anthropic, OpenAI, Google, or any other supported provider

## What you can build

Once integrated, your AI can handle requests like:

**Real-time information:**
- "What happened in AI last week?"
- "Find recent articles about quantum computing"

**Content extraction:**
- "Extract and summarize the docs from anthropic.com"
- "Get the pricing from competitor.com and compare it to ours"

**AI-powered search:**
- "Search for TypeScript best practices and show me examples"
- "Find the latest React features and explain the benefits"

## Quick example

After installation, you'll have code like this:

```typescript
import { generateText } from 'ai';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const result = await generateText({
  model: yourModel,
  tools: {
    search: youSearch(),
  },
  prompt: 'What are the latest developments in quantum computing?',
});
```

Your AI will automatically search the web and provide current, accurate answers.

## Common issues

<details>
<summary><strong>Cannot find module @youdotcom-oss/ai-sdk-plugin</strong></summary>

The plugin should have installed it automatically. If not, run:

```bash
# NPM
npm install @youdotcom-oss/ai-sdk-plugin

# Bun
bun add @youdotcom-oss/ai-sdk-plugin

# Yarn
yarn add @youdotcom-oss/ai-sdk-plugin

# pnpm
pnpm add @youdotcom-oss/ai-sdk-plugin
```

</details>

<details>
<summary><strong>YDC_API_KEY environment variable is required</strong></summary>

Set your API key:

```bash
export YDC_API_KEY=your-key-here
```

Get your key at [you.com/platform/api-keys](https://you.com/platform/api-keys)

</details>

<details>
<summary><strong>Incomplete or missing response</strong></summary>

If your streamText response doesn't return anything or stops early, increase the step count. Start with 3 and iterate up as needed:

```typescript
import { streamText } from 'ai';
import { stepCountIs } from 'ai/advanced';

const { textStream } = streamText({
  model: yourModel,
  tools: { search: youSearch() },
  stopWhen: stepCountIs(3),  // Start at 3, increase if needed
  prompt: 'Your query',
});
```

If the response is still incomplete, try `stepCountIs(5)` or higher.

</details>

<details>
<summary><strong>Custom environment variable not working</strong></summary>

Pass your API key explicitly to each tool:

```typescript
const apiKey = process.env.YOUR_CUSTOM_NAME;

tools: {
  search: youSearch({ apiKey }),
  agent: youExpress({ apiKey }),
}
```

</details>

## Documentation

- **Package documentation** - [Full API reference and examples](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/ai-sdk-plugin)
- **Vercel AI SDK docs** - [Official AI SDK documentation](https://sdk.vercel.ai/docs)
- **You.com API** - [Platform and API keys](https://you.com/platform/api-keys)

## Support

Need help?
- **GitHub Issues** - [Report issues or ask questions](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email** - support@you.com

## License

MIT - See [LICENSE](./LICENSE)

## Related

- [`@youdotcom-oss/ai-sdk-plugin`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/ai-sdk-plugin) - The npm package this plugin helps you integrate
- [`@youdotcom-oss/mcp`](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp) - You.com MCP server for Claude Desktop
- [Marketplace](https://github.com/youdotcom-oss/dx-toolkit/blob/main/docs/MARKETPLACE.md) - Browse all available plugins
