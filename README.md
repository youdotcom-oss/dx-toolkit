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

## Marketplace

Cross-platform plugins for Claude Code, Cursor, Windsurf, and other AI coding assistants. Guided workflows for enterprise integrations, AI workflows, and deployment automation.

### [teams-mcp-integration](./plugins/teams-mcp-integration/) v1.0.0
Generate Microsoft Teams apps with You.com MCP integration using `@youdotcom-oss/teams-anthropic` - handles setup workflow for new and existing apps. **[Plugin Docs →](./plugins/teams-mcp-integration/README.md)** • **[Marketplace Docs →](./docs/MARKETPLACE.md)**

**Quick install:**
```bash
# Claude Code
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --cursor

# Other AI agents (Cody, Windsurf, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --agents.md
```

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
echo "export YDC_API_KEY=your-actual-api-key-here" > .env
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
# MCP Server
bun run dev:mcp          # Start MCP server in STDIO mode
bun run start:mcp        # Start MCP server in HTTP mode
bun run test:mcp         # Test MCP server only

# Future packages will follow same pattern:
# bun run dev:<package>
# bun run start:<package>
# bun run test:<package>
```

**From Package Directory** (standard commands all packages support):

```bash
cd packages/<package-name>

bun run dev              # Start package in development mode
bun start                # Start package in production mode
bun test                 # Run package tests
bun run check            # Check package code quality
bun run check:write      # Auto-fix package issues
```

For detailed package command documentation, see [AGENTS.md](./AGENTS.md#package-specific-commands).

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
│   └── teams-mcp-integration/
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

**Packages in Development** (Target: 12/16/2025)
- **@youdotcom-oss/openai-sdk-plugin** - OpenAI SDK integration for web search and AI agents
- **@youdotcom-oss/claude-agent-sdk** - Claude Agent SDK patterns and orchestration utilities

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
