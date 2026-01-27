# You.com DX Toolkit

**Open-source monorepo for AI-powered development - npm packages and development skills for building with You.com's AI capabilities.**

Build with You.com's AI capabilities across your entire workflow:

- **📦 NPM Packages** - Ready-to-use integrations for popular frameworks (MCP, AI SDK, Teams.ai)
- **🎯 Development Skills** - Project-specific patterns and workflows (code patterns, git workflow, testing)

---

## NPM Packages

Production-ready packages for building, testing, and shipping agentic workflows:

### [@youdotcom-oss/mcp](./packages/mcp/)
MCP Server giving AI agents real-time web search, AI answers, and content extraction via Model Context Protocol. **[Documentation →](./packages/mcp/README.md)**

### [@youdotcom-oss/ai-sdk-plugin](./packages/ai-sdk-plugin/)
Vercel AI SDK plugin for You.com web search and AI agents - zero server setup, works with any model provider. **[Documentation →](./packages/ai-sdk-plugin/README.md)**

### [@youdotcom-oss/teams-anthropic](./packages/teams-anthropic/)
Use Claude models (Opus, Sonnet, Haiku) in Microsoft Teams.ai apps - drop-in replacement for OpenAI with full streaming support. **[Documentation →](./packages/teams-anthropic/README.md)**

## Agent Skills

**Cross-platform integration skills have moved to [youdotcom-oss/agent-skills](https://github.com/youdotcom-oss/agent-skills).**

The agent-skills repository provides guided workflows for integrating You.com packages with popular AI frameworks:

- **ai-sdk-integration** - Vercel AI SDK integration with You.com tools
- **claude-agent-sdk-integration** - Claude Agent SDK with You.com MCP server
- **openai-agent-sdk-integration** - OpenAI Agents SDK with You.com MCP server
- **teams-anthropic-integration** - Microsoft Teams.ai with Anthropic Claude models

**Installation:**
```bash
npx skills add youdotcom-oss/agent-skills
```

**[View all skills →](https://github.com/youdotcom-oss/agent-skills)**

---

## Development Skills

Project-specific development patterns and workflows are in `.claude/skills/`:

- **[documentation](/.claude/skills/documentation/)** - Documentation standards (thin AGENTS.md philosophy, TSDoc strategy, README.md tone)
- **[mcp-patterns](/.claude/skills/mcp-patterns/)** - MCP server patterns (Zod schemas, error handling, logging, response format)
- **[ai-sdk-patterns](/.claude/skills/ai-sdk-patterns/)** - Vercel AI SDK patterns (input schemas, API key handling, response format)
- **[teams-anthropic-patterns](/.claude/skills/teams-anthropic-patterns/)** - Teams.ai patterns (Memory API, Anthropic SDK, MCP client setup)

These skills are used by AI coding assistants when contributing to dx-toolkit packages. **[View development guide →](./AGENTS.md)**

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
├── .claude/
│   ├── rules/             # Universal patterns (code, git, testing)
│   └── skills/            # Package-specific patterns
│       ├── documentation/
│       ├── mcp-patterns/
│       ├── ai-sdk-patterns/
│       └── teams-anthropic-patterns/
├── packages/
│   ├── mcp/               # MCP Server package
│   ├── ai-sdk-plugin/     # Vercel AI SDK plugin
│   └── teams-anthropic/   # Teams.ai Anthropic integration
│       ├── src/           # Source code
│       ├── dist/          # Compiled output
│       ├── templates/     # Code templates
│       ├── README.md      # User documentation
│       └── package.json   # Package config
├── .github/
│   └── workflows/         # CI/CD workflows
├── docs/
│   └── PERFORMANCE.md     # Performance monitoring
├── AGENTS.md              # Monorepo dev guide
├── package.json           # Workspace root config
└── README.md              # This file
```

## Roadmap

**Packages in Development** (Target: Q1 2026)
- **@youdotcom-oss/eval** - Evaluation harness for You.com API responses
- **@youdotcom-oss/cli** - CLI tool for You.com API interactions

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
