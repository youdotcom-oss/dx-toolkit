# You.com DX Toolkit

**Open-source monorepo for AI-powered development - npm packages and development skills for building with You.com's AI capabilities.**

Build with You.com's AI capabilities across your entire workflow:

- **📦 NPM Packages** - Ready-to-use integrations for popular frameworks (MCP, AI SDK, Teams.ai)

---

## NPM Packages

Production-ready packages for building, testing, and shipping agentic workflows:

### [@youdotcom-oss/api](./packages/api/)
CLI tool and shared TypeScript utilities for You.com API - provides command-line interface and type-safe building blocks used by MCP and AI SDK packages. **[Documentation →](./packages/api/README.md)**

### [@youdotcom-oss/mcp](./packages/mcp/)
MCP Server giving AI agents real-time web search, AI answers, and content extraction via Model Context Protocol. **[Documentation →](./packages/mcp/README.md)**

### [@youdotcom-oss/ai-sdk-plugin](./packages/ai-sdk-plugin/)
Vercel AI SDK plugin for You.com web search and AI agents - zero server setup, works with any model provider. **[Documentation →](./packages/ai-sdk-plugin/README.md)**

### [@youdotcom-oss/teams-anthropic](./packages/teams-anthropic/)
Use Claude models (Opus, Sonnet, Haiku) in Microsoft Teams.ai apps - drop-in replacement for OpenAI with full streaming support. **[Documentation →](./packages/teams-anthropic/README.md)**

### [@youdotcom-oss/n8n-nodes-youdotcom](./packages/n8n-nodes-youdotcom/)
n8n community node for You.com APIs - web search, content extraction, and AI-powered answers with citations for n8n workflows. **[Documentation →](./packages/n8n-nodes-youdotcom/README.md)**

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
# Edit .env and add your YDC_API_KEY
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

**Troubleshooting tests:**
If you get API key errors when running tests:
1. Verify `.env` file exists with `YDC_API_KEY=your-key`
2. Run `source .env` to load environment variables
3. Try running tests again: `bun test`

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

**From Root** - Two patterns available:

```bash
# Pattern 1: Root shortcuts (defined in root package.json)
bun run dev:mcp          # Start MCP server in STDIO mode
bun run start:mcp        # Start MCP server in HTTP mode
bun run test:mcp         # Test MCP server only

# Pattern 2: Direct package commands with bun --cwd
bun --cwd packages/mcp dev      # Start MCP server in dev mode
bun --cwd packages/mcp start    # Start MCP server in HTTP mode
bun --cwd packages/mcp test     # Test MCP server
bun --cwd packages/mcp check    # Run quality checks

# Use bun --cwd for any package script:
bun --cwd packages/api test
bun --cwd packages/ai-sdk-plugin build
bun --cwd packages/teams-anthropic check
```

**From Package Directory**:

```bash
cd packages/mcp
bun dev                  # Start in development mode
bun test                 # Run tests
bun run check            # Check code quality
```

## Documentation

### Package Documentation
- **[API Package README](./packages/api/README.md)** - CLI tool and shared utilities for You.com API
- **[MCP Server README](./packages/mcp/README.md)** - User-focused setup and usage guide with API examples
- **[AI SDK Plugin README](./packages/ai-sdk-plugin/README.md)** - Vercel AI SDK integration guide
- **[Teams Anthropic README](./packages/teams-anthropic/README.md)** - Microsoft Teams.ai integration guide

### Contributor Documentation
Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
- **[AGENTS.md](./AGENTS.md)** - Comprehensive development guidelines for maintainers and agentic IDEs

## License

MIT - See [LICENSE](./LICENSE) for details

## Support
- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
- **Web**: [You.com Support](https://you.com/support/contact-us)

---

**Built with ❤️ by [You.com](https://you.com)**
