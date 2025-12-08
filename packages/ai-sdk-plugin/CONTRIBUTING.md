# Contributing to Vercel AI SDK plugin for You.com

Thank you for your interest in contributing!

## Code of Conduct

This project adheres to professional open-source standards. Be respectful, constructive, and collaborative.

## Getting Started

### Prerequisites

- Bun >= 1.2.21
- You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys)

### Quick Setup

\`\`\`bash
git clone https://github.com/youdotcom-oss/ai-sdk-plugin.git
cd ai-sdk-plugin
bun install
bun run dev
\`\`\`

For detailed development setup, see [AGENTS.md](./AGENTS.md).

## How to Contribute

### Reporting Bugs

**Before submitting**: Check [existing issues](https://github.com/youdotcom-oss/ai-sdk-plugin/issues)

**When reporting**, include:
- Clear bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Bun/Node version, OS, AI SDK version)

### Suggesting Features

Open an issue with:
- Clear use case description
- Why this benefits users
- Example usage (if applicable)

### Submitting Pull Requests

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes with tests
4. Run checks: `bun run check`
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
6. Push and create PR

## Development Workflow

See [AGENTS.md](./AGENTS.md) for:
- Code patterns
- Testing guidelines
- Architecture details

## Testing

All contributions must include tests:

- **Unit tests** for new functions/logic
- **Integration tests** for API interactions
- Maintain >80% code coverage

Run tests before submitting PR:

\`\`\`bash
bun test
bun test:coverage
\`\`\`

## Code Quality

We use Biome for linting and formatting:

\`\`\`bash
bun run check          # Check all
bun run check:write    # Auto-fix
\`\`\`

All PRs must pass CI checks.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/ai-sdk-plugin/issues)
- **Email**: support@you.com
