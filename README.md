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

## Universal Plugin Marketplace

**Cross-platform plugins** that work with Claude Code, Cursor, Windsurf, and other AI coding assistants. Install once, use everywhere.

These plugins provide guided workflows for enterprise integrations, AI workflows, and deployment automation.

### Available Plugins

#### teams-mcp-integration

Integrate Microsoft Teams apps with You.com MCP server using the `@youdotcom-oss/teams-anthropic` package.

- **Category**: enterprise-integration
- **Version**: 1.0.0
- **Public URL**: https://api.you.com/plugins/teams-mcp-integration/
- **Package**: `@youdotcom-oss/teams-anthropic`

**Features**:
- Orchestrates package installation workflow
- Guides new app vs existing app setup
- Template-based integration with inline markers
- Environment configuration guidance
- Cross-platform AI agent support

### Installation

**One-command install** for any platform:

```bash
# Claude Code (adds to marketplace, installs plugin)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --claude

# Cursor (installs to .claude/plugins/, enable in Settings → Rules)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --cursor

# Other AI agents - Cody, Windsurf, Continue, etc. (adds to AGENTS.md)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration --agents.md
```

**Claude Code marketplace method:**
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
/plugin install teams-mcp-integration
/generate-teams-app
```

**[View full marketplace documentation →](./docs/MARKETPLACE.md)**

### Plugin Roadmap

**In Development (Target: 12/16/2025)**
- OpenAI SDK Plugin - Web search integration for OpenAI SDK
- Claude Agent SDK Plugin - Agent orchestration patterns

**Coming Q1 2026**
- Google Chat MCP Integration
- Evaluation Harness
- Local RAG with SQLite
- Cloud Deployment Automation
- RL Pipeline Starter

**[View complete roadmap →](./docs/ROADMAP.md)**

## Quick Start

### For MCP Server Users

If you want to use the You.com MCP Server with your AI agent (Claude, Cursor, etc.):

**👉 [See the MCP Server documentation](./packages/mcp/README.md)**

The MCP Server README contains:
- Setup instructions for all MCP clients
- Configuration examples
- Available tools and usage
- Troubleshooting guide

### For Contributors

If you want to contribute code or report issues:

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

# Run MCP server in development
bun run dev:mcp

# Run all tests
bun test

# Run all quality checks
bun run check
```

For comprehensive development guidelines including code patterns, testing, git workflow, and troubleshooting, see [AGENTS.md](./AGENTS.md).

## Working with AI Agents on This Project

### Using Claude Code or Other AI Assistants

This project is designed to work seamlessly with AI coding agents like Claude Code. We provide specialized context files to help AI agents understand our patterns and architecture:

**📋 CLAUDE.md** - Entry point that references AGENTS.md files

**🛠️ AGENTS.md** - Comprehensive development guidelines including:
  - Monorepo structure and architecture
  - Code style patterns (arrow functions, Zod schemas, MCP-specific patterns)
  - Testing patterns and anti-patterns
  - Git workflow and commit conventions
  - Troubleshooting guides

**⚙️ .mcp.example.json** - MCP server configuration for AI agents

#### Recommended Workflow

1. **Initial context**: Reference `@AGENTS.md` or `@CLAUDE.md` in your prompt
2. **Understand architecture**: Ask agent to read relevant sections
3. **Make changes**: Agent follows documented patterns automatically
4. **Quality checks**: `bun run check` ensures code quality
5. **Testing**: `bun test` validates changes

#### Example Prompts

```
"Following @AGENTS.md patterns, add a new MCP tool for X"
"Review @packages/mcp/AGENTS.md and refactor Y"
"Using patterns from @AGENTS.md, write tests for Z"
```

## GitHub Workflows

This project uses automated workflows for code quality, releases, and deployments.

### Continuous Integration

**Code Quality Checks**
- Workflow: `.github/workflows/ci.yml`
- Trigger: Pull requests and pushes to main
- Purpose: Validates code quality and tests for all packages
- Runs: Biome linting, TypeScript type checking, and test suite

**Code Review**
- Internal: `.github/workflows/code-review.yml` (automatic on PR)
- External: `.github/workflows/external-code-review.yml` (manual trigger)
- Purpose: AI-powered code analysis and suggestions

### Publishing and Deployment

**Publishing Packages**
- Workflow: `.github/workflows/publish-mcp.yml` (example for MCP package)
- Trigger: Manual via GitHub Actions UI
- Purpose: Update version, create GitHub release, publish to npm
- Process:
  1. Updates package.json version
  2. Updates workspace dependencies
  3. Creates GitHub release
  4. Publishes to npm
  5. (MCP only) Triggers remote deployment via repository_dispatch

**Note**: The MCP package includes additional deployment steps to trigger remote infrastructure updates. Other packages in this monorepo have simpler publish workflows without deployment.

For comprehensive workflow documentation, see [AGENTS.md](./AGENTS.md#monorepo-architecture).

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
- **[AGENTS.md](./AGENTS.md)** - Comprehensive development guidelines for maintainers
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

## Contributing

Contributions are welcome! Each open source package includes its own contribution guidelines:

- **MCP Server**: See [packages/mcp/README.md](./packages/mcp/README.md) and [packages/mcp/CONTRIBUTING.md](./packages/mcp/CONTRIBUTING.md)
- **AI SDK Plugin**: See [packages/ai-sdk-plugin/README.md](./packages/ai-sdk-plugin/README.md)
- **Teams Anthropic**: See [packages/teams-anthropic/README.md](./packages/teams-anthropic/README.md)

For internal maintainers, see [AGENTS.md](./AGENTS.md) for comprehensive development details.

## Testing

```bash
# Run all tests
bun run test

# Test specific package
bun run test:mcp         # MCP server only

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch
```

Requires `YDC_API_KEY` environment variable for API tests.

## Code Quality

This project uses [Biome](https://biomejs.dev/) for code formatting and linting:

```bash
# Check all packages
bun run check

# Auto-fix all issues
bun run check:write

# Individual checks
bun run check:biome       # Lint and format
bun run check:types       # TypeScript
bun run check:package     # package.json format
```

Git hooks automatically enforce code quality on commit.

## License

MIT - See [LICENSE](./LICENSE) for details

## Support

- **Documentation**: [MCP Server Docs](./packages/mcp/README.md)
- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com
- **Web**: [You.com Support](https://you.com/support/contact-us)

---

**Built with ❤️ by [You.com](https://you.com)**
