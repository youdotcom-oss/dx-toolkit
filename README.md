# You.com DX Toolkit

**Open-source toolkit for AI-powered development - npm packages, plugins, and skills that work with Claude Code, Cursor, and 20+ AI coding assistants.**

Build with You.com's AI capabilities across your entire workflow:

- **📦 NPM Packages** - Ready-to-use integrations for popular frameworks
- **🔌 Universal Plugins** - Cross-platform plugins for AI coding assistants
- **🎯 Claude Code Skills** - Context-aware development patterns

---

## NPM Packages

Production-ready packages for building, testing, and shipping agentic workflows:

### [@youdotcom-oss/mcp](./packages/mcp/)
MCP Server giving AI agents real-time web search, AI answers, and content extraction via Model Context Protocol. **[Documentation →](./packages/mcp/README.md)**

### [@youdotcom-oss/ai-sdk-plugin](./packages/ai-sdk-plugin/)
Vercel AI SDK plugin for You.com web search and AI agents - zero server setup, works with any model provider. **[Documentation →](./packages/ai-sdk-plugin/README.md)**

### [@youdotcom-oss/teams-anthropic](./packages/teams-anthropic/)
Use Claude models (Opus, Sonnet, Haiku) in Microsoft Teams.ai apps - drop-in replacement for OpenAI with full streaming support. **[Documentation →](./packages/teams-anthropic/README.md)**

## Skills

Cross-platform skills for Claude Code, Cursor, Windsurf, and other AI coding assistants. Guided workflows for enterprise integrations, AI SDK workflows, and agent SDK integrations.

### [ai-sdk-integration](./plugins/ai-sdk-integration/)
Add You.com's search, AI agent, and content extraction tools to Vercel AI SDK applications - interactive setup workflow with smart integration. **[Documentation →](./plugins/ai-sdk-integration/README.md)**

### [teams-anthropic-integration](./plugins/teams-anthropic-integration/)
Generate Microsoft Teams apps with You.com Anthropic integration using `@youdotcom-oss/teams-anthropic` - handles setup workflow for new and existing apps. **[Documentation →](./plugins/teams-anthropic-integration/README.md)**

### [claude-agent-sdk-integration](./plugins/claude-agent-sdk-integration/)
Integrate Claude Agent SDK with You.com MCP server - guided setup for Python and TypeScript with HTTP MCP configuration. **[Documentation →](./plugins/claude-agent-sdk-integration/README.md)**

### [openai-agent-sdk-integration](./plugins/openai-agent-sdk-integration/)
Integrate OpenAI Agents SDK with You.com MCP server - supports Hosted MCP and Streamable HTTP for Python and TypeScript. **[Documentation →](./plugins/openai-agent-sdk-integration/README.md)**

## Quick Start

**Prerequisites:**
- Bun >= 1.2.21: [Installation guide](https://bun.sh/docs/installation)
- GitHub CLI (recommended): `brew install gh` (macOS) or [other platforms](https://github.com/cli/cli#installation)

**Development setup:**
```bash
# Clone repository
git clone git@github.com:youdotcom-oss/dx-toolkit.git
cd dx-toolkit

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env and add your YDC_API_KEY and ANTHROPIC_API_KEY
source .env

# Authenticate with GitHub (if using gh CLI)
gh auth login

# Build all packages
bun run build

# Run all tests
bun test

# Run all quality checks
bun run check
```

**For comprehensive development guidelines**, see [AGENTS.md](./AGENTS.md).

## Monorepo Commands

This toolkit uses Bun workspaces. Commands can run at workspace-level (all packages) or package-level (specific package).

### Workspace-Level Commands

Run from repository root to affect all packages:

```bash
bun install              # Install dependencies for all packages
bun run build            # Build all packages
bun test                 # Test all packages
bun run check            # Run all quality checks (biome + types + package)
bun run check:write      # Auto-fix all issues across all packages
```

### Package-Specific Commands

**From Root** (run specific package commands):

```bash
# MCP Server (using root shortcuts)
bun run dev:mcp          # Start MCP server in STDIO mode
bun run start:mcp        # Start MCP server in HTTP mode
bun run test:mcp         # Test MCP server only

# Or call package scripts directly:
bun --cwd packages/mcp dev
bun --cwd packages/mcp start
bun --cwd packages/mcp test

# All packages follow this pattern:
# bun run <command>:<package>
# bun --cwd packages/<package> <command>
```

## Documentation

### Package Documentation
- **[MCP Server README](./packages/mcp/README.md)** - User-focused setup and usage guide with API examples
- **[AI SDK Plugin README](./packages/ai-sdk-plugin/README.md)** - Vercel AI SDK integration guide
- **[Teams Anthropic README](./packages/teams-anthropic/README.md)** - Microsoft Teams.ai integration guide

### Contributor Documentation
- **[AGENTS.md](./AGENTS.md)** - Comprehensive development guidelines for maintainers and agentic IDEs
- **[Package-Level CONTRIBUTING.md](./packages/mcp/CONTRIBUTING.md)** - Contribution guidelines and pull request process

## Directory Structure

```
dx-toolkit/
├── marketplace.json       # Plugin marketplace manifest
├── packages/
│   ├── mcp/               # MCP Server package
│   ├── ai-sdk-plugin/     # Vercel AI SDK plugin
│   └── teams-anthropic/   # Teams.ai Anthropic integration
│       ├── src/           # Source code
│       ├── dist/          # Compiled output
│       ├── templates/     # Code templates
│       ├── README.md      # User documentation
│       ├── AGENTS.md      # Package dev guide
│       └── package.json   # Package config
├── plugins/               # Claude Code plugins
│   └── teams-anthropic-integration/
│       ├── .claude-plugin/
│       ├── commands/
│       ├── src/
│       ├── templates/
│       ├── AGENTS.md      # Plugin instructions
│       └── README.md      # Plugin docs
├── .github/
│   └── workflows/         # CI/CD workflows
├── docs/
│   └── MARKETPLACE.md     # Marketplace documentation
├── AGENTS.md              # Monorepo dev guide
├── package.json           # Workspace root config
└── README.md              # This file
```

## Roadmap

**Plugins in Development** (Target: Q1 2026)
- **google-chat-mcp-integration** - Google Chat apps with You.com MCP server
- **eval-harness** - Evaluation harness for MCP tools (includes skills)
- **local-rag-sqlite** - Local RAG with SQLite backend (includes skills)
- **cloud-deployment** - Cloud-agnostic deployment automation (includes skills)
- **rl-pipeline** - Reinforcement learning pipeline starter (includes skills)

**[View complete roadmap →](./docs/ROADMAP.md)**

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](./LICENSE) for details

## Support

- **Documentation**: [MCP Server Docs](./packages/mcp/README.md)
- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
- **Web**: [You.com Support](https://you.com/support/contact-us)

---

**Built with ❤️ by [You.com](https://you.com)**
