# You.com MCP Server

The You.com MCP Server gives your AI agents **real-time access to the latest web information** through the [Model Context Protocol](https://modelcontextprotocol.io/). Search current content, get up-to-date answers, and extract live web pages—whether in your IDE or deployed agentic workflows. Built on MCP to **work everywhere your agents do**—one integration, unlimited compatibility across IDEs, frameworks, and production systems. 

## Features

- **Web and news search**: Comprehensive search using You.com's unified Search API with advanced search operators
- **AI-powered Express Agent**: Fast responses with optional real-time web search integration
- **Content extraction**: Extract and retrieve full content from web pages in markdown or HTML format
- **Multiple transport protocols**: STDIO and Streamable HTTP support
- **Bearer Token Authentication**: Secure API access in HTTP mode
- **TypeScript support**: Full type safety with Zod schemas
- **Advanced search parameters**: Site filtering, file type filtering, language filtering, exact terms, and exclude terms

## Getting started

Get up and running with the You.com MCP Server in 4 quick steps:

### 1. Get your API key

Visit [you.com/platform/api-keys](https://you.com/platform/api-keys) to get your You.com API key. Keep this key secure - you'll need it for configuration.

### 2. Choose your setup

You can discover this server in the [Anthropic MCP Registry](https://registry.modelcontextprotocol.io/) as `io.github.youdotcom-oss/mcp`, or configure it manually:

**Remote server (recommended)** - No installation, always up-to-date, just add the URL and API key
- Use `https://api.you.com/mcp` with HTTP transport
- Authentication via `Authorization: Bearer <your-key>` header

**NPM package** - Runs locally on your machine
- Use `npx @youdotcom-oss/mcp` with STDIO transport
- Authentication via `YDC_API_KEY` environment variable
- Requires Bun or Node.js

### 3. Configure your client

Choose your MCP client from the [detailed setup guides](#adding-to-your-mcp-client) below. Most clients use this basic structure:

**Remote server (recommended):**
```json
{
  "mcpServers": {
    "ydc-server": {
      "type": "http",
      "url": "https://api.you.com/mcp",
      "headers": { "Authorization": "Bearer <you-api-key>" }
    }
  }
}
```

**NPM package:**
```json
{
  "mcpServers": {
    "ydc-server": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": { "YDC_API_KEY": "<you-api-key>" }
    }
  }
}
```

**Configuration notes:**
- Remote server recommended for most users (no installation, always up-to-date)
- NPM package for local usage or self-hosting scenarios
- HTTP transport for remote connections; STDIO transport for local packages
- API key always required (header for HTTP, environment variable for STDIO)

### 4. Test your setup

Ask your AI agent a simple query to verify everything works:
- "Search the web for the latest news about artificial intelligence"
- "What is the capital of France?" (with web search)
- "Extract the content from https://example.com"

Your agent will automatically use the appropriate tool based on your natural language request.

## Adding to your MCP client

Detailed configuration instructions for specific MCP clients. See [Getting Started](#getting-started) above for a quick overview.

<details>
<summary><strong>Claude Code</strong></summary>

Use the Claude Code CLI to add the You.com MCP server:

**Quick setup:**
```bash
claude mcp add --transport http ydc-server https://api.you.com/mcp --header "Authorization: Bearer <your-api-key>"
```

For setup, follow the MCP installation [guide](https://code.claude.com/docs/en/mcp).

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

For setup, follow the MCP installation [guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

</details>

<details>
<summary><strong>Codex</strong></summary>

For setup, follow the MCP installation [guide](https://github.com/openai/codex/blob/main/docs/config.md#streamable-http).

</details>

<details>
<summary><strong>Cursor IDE</strong></summary>

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=ydc-server&config=eyJ1cmwiOiJodHRwczovL2FwaS55b3UuY29tL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciA8eW91LWFwaS1rZXk%2BIn19)

For setup, follow the MCP installation [guide](https://cursor.com/docs/context/mcp#installing-mcp-servers); use the configuration template above ***without type field***.

**Note:** To avoid conflicts, go to Settings > Agents tab and turn off Cursor's built-in web search tool.

</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

For setup, follow the MCP installation [guide](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html#how-to-set-up-your-mcp-server); use the configuration template above.

</details>

<details>
<summary><strong>JetBrains IDEs</strong></summary>

For setup, follow the MCP installation [guide](https://www.jetbrains.com/help/ai-assistant/mcp.html#connect-to-an-mcp-server); use the configuration template above.

**Supported IDEs:** IntelliJ IDEA, PyCharm, WebStorm, etc. (requires AI Assistant enabled)

</details>

<details>
<summary><strong>LM Studio</strong></summary>

For setup, follow the MCP installation [guide](https://lmstudio.ai/docs/app/mcp); use the configuration template above ***without type field***.

</details>

<details>
<summary><strong>opencode</strong></summary>

For setup, follow the MCP installation [guide](https://opencode.ai/docs/mcp-servers/#remote); use the configuration template above.

</details>

<details>
<summary><strong>VS Code</strong></summary>

Use the VS Code CLI to add the You.com MCP server:

**Quick setup (command line):**
```bash
code --add-mcp "{\"name\":\"ydc-server\",\"url\":\"https://api.you.com/mcp\",\"type\":\"http\",\"headers\":{\"Authorization\":\"Bearer <your-api-key>\"}}"
```

For setup, follow the MCP installation [guide](https://code.visualstudio.com/docs/copilot/customization/mcp-servers#_add-an-mcp-server); use the configuration template above.

</details>

<details>
<summary><strong>Windsurf</strong></summary>

For setup, follow the MCP installation [guide](https://docs.windsurf.com/windsurf/cascade/mcp#adding-a-new-mcp-plugin).

</details>

<details>
<summary><strong>Zed Editor</strong></summary>

For setup, follow the MCP installation [guide](https://zed.dev/docs/ai/mcp#as-custom-servers); use the configuration template above ***without type field***.

</details>

## Available tools

This MCP server provides three tools that work seamlessly with your AI agent through natural language:

### you-search
Comprehensive web and news search with advanced filtering capabilities. Perfect for finding current information, research articles, documentation, and news stories.

**When to use**: When you need to search the web for information, filter by specific sites/file types, or get the latest news on a topic.

### you-express
Fast AI-powered agent that provides synthesized answers with optional real-time web search. Ideal for straightforward questions that benefit from AI interpretation.

**When to use**: When you want a direct answer to a question, with optional web search for up-to-date context and citations.

### you-contents
Extract full page content from URLs in markdown or HTML format. Useful for documentation analysis, content processing, and batch URL extraction.

**When to use**: When you need to extract and analyze content from web pages, either for reading or processing in your workflow.

---

**Note**: Your MCP client automatically shows you all available parameters and their descriptions when you use these tools. Simply ask your AI agent in natural language what you want to do, and it will orchestrate the appropriate tool calls for you.

## Use cases & examples

Here are common scenarios showing when and how to use each tool with natural language queries:

### Research & information gathering

**Use you-search when:**
- "Find recent research papers about quantum computing on arxiv.org"
- "Search for TypeScript documentation about generics"
- "Get the latest news about renewable energy from the past week"
- "Find PDF files about machine learning algorithms"

**Use you-express when:**
- "What are the key differences between REST and GraphQL?"
- "Explain how quantum entanglement works"
- "What happened in the tech industry today?" (with web search enabled)
- "Summarize the main features of the latest Python release"

### Content extraction & analysis

**Use you-contents when:**
- "Extract the content from this blog post: https://example.com/article"
- "Get the documentation from these three URLs in markdown format"
- "Pull the HTML content from this page preserving the layout"
- "Batch extract content from these 5 documentation pages"

### Combined workflows

Your AI agent can combine multiple tools in a single conversation:
1. **Research + Extract**: "Search for the best TypeScript tutorials, then extract the content from the top 3 results"
2. **Question + Deep Dive**: "What is WebAssembly? Then search for real-world examples and extract code samples"
3. **News + Analysis**: "Find recent articles about AI regulation, then summarize the key points"

### Pro tips

- **Be specific**: Include domains, date ranges, or file types when searching
- **Natural language**: You don't need to memorize parameters - just describe what you want
- **Follow up**: Ask clarifying questions to refine results
- **Combine tools**: Let your agent orchestrate multiple tool calls for complex workflows

## Troubleshooting & support

### Common issues

**Server not connecting:**
- Verify your API key is correct and properly formatted
- Check that your MCP client configuration matches the template for your setup (remote vs local)
- For HTTP mode: Ensure the Authorization header includes "Bearer " prefix
- For STDIO mode: Verify the YDC_API_KEY environment variable is set

**Tool not working:**
- Check your MCP client logs for error messages
- Verify your API key has the necessary permissions
- For remote server: Ensure you can reach https://api.you.com/mcp-health
- For local: Verify Bun or Node.js is installed and the package is properly set up

**Authentication errors:**
- Remote server uses Bearer token authentication in headers
- Local STDIO mode uses YDC_API_KEY environment variable
- Make sure you're using the correct authentication method for your setup

### Error logs

Error messages and detailed logs appear in your MCP client's log output. Check your client's documentation for how to access logs:
- Claude Code: Check terminal output or logs
- Claude Desktop: View logs in application menu
- Cursor: Check MCP server logs in settings
- VS Code: View Output panel for MCP server logs

### Report an issue

If you encounter a problem, you can report it via email or GitHub:

**Email support:** support@you.com

**Web support:** [You.com Support](https://you.com/support/contact-us)

**GitHub Issues:** [Report bugs and feature requests](https://github.com/youdotcom-oss/mcp-server/issues)

**Tip:** When errors occur, check your MCP client logs - they include a pre-filled mailto link with error details for easy reporting.

## For contributors

Interested in contributing to the You.com MCP Server? We'd love your help!

Need technical details? Check [AGENTS.md](./AGENTS.md) for complete development setup, architecture overview, code patterns, and testing guidelines.

1. Fork the repository
2. Create a feature branch following naming conventions in [CONTRIBUTING.md](../../CONTRIBUTING.md) 
3. Follow the code style guidelines and use conventional commits
4. Write tests for your changes (maintain >80% coverage)
5. Run quality checks: `bun run check && bun test`
6. Submit a pull request with a clear description

We appreciate all contributions, whether it's:
- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage improvements

---

**License**: MIT
**Author**: You.com (https://you.com)
