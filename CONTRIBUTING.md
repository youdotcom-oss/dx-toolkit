# Contributing to You.com MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to professional open-source standards. Be respectful, constructive, and collaborative in all interactions.

## Getting Started

### Prerequisites

- Bun >= 1.2.21
- You.com API key from [api.you.com](https://api.you.com)

### Quick Setup

```bash
git clone https://github.com/youdotcom-oss/youdotcom-mcp-server.git
cd youdotcom-mcp-server
bun install
echo "export YDC_API_KEY=your-key" > .env
source .env
bun run dev
```

For detailed development setup, code patterns, and architecture, see [AGENTS.md](./AGENTS.md).

## How to Contribute

### Reporting Bugs

**Before submitting**: Check [existing issues](https://github.com/youdotcom-oss/youdotcom-mcp-server/issues)

**When reporting**, include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Bun version, OS, MCP client)
- Error logs from your MCP client

**Where to report**:

- GitHub Issues: https://github.com/youdotcom-oss/youdotcom-mcp-server/issues
- Email: support@you.com (for security issues)

### Suggesting Enhancements

We welcome feature requests! Please:

1. Check if the feature already exists or is planned
2. Open an issue describing the enhancement
3. Explain the use case and benefits
4. Be open to discussion and iteration

### Submitting Pull Requests

#### 1. Fork and Create Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/youdotcom-mcp-server.git
cd youdotcom-mcp-server
git checkout -b feature/your-feature-name
```

**Branch naming**:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `dx-<issue-num>-description` - DX improvements

#### 2. Make Your Changes

**Code Style**:

- Follow patterns in [AGENTS.md](./AGENTS.md)
- Use arrow functions for declarations
- Run `bun run check:write` to auto-fix style issues

**Testing**:

- Add tests for new features
- Maintain >80% coverage for utilities
- Run `bun test` to verify

**Documentation**:

- Update AGENTS.md for developer-facing changes
- Update README.md for user-facing changes
- Add JSDoc comments for public APIs

#### 3. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance
- `ci`: CI/CD changes
- `perf`: Performance
- `style`: Code style
- `build`: Build system

**Scopes** (optional):

- `search`, `express`, `contents`, `shared`, `http`, `stdio`

**Examples**:

```bash
git commit -m "feat(search): add freshness filter support"
git commit -m "fix(express): handle timeout errors gracefully"
git commit -m "docs: update API examples in README"
```

#### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:

- Clear title following commit conventions
- Description of changes and motivation
- Reference to related issues
- Screenshots/examples if applicable

#### 5. Code Review

- Maintainers will review your PR
- Address feedback constructively
- Keep PR focused (one feature/fix per PR)
- Be patient - reviews take time

**PR Checklist**:

- [ ] All tests pass (`bun test`)
- [ ] Code quality checks pass (`bun run check`)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

## Development Workflow

### Quality Checks

Before submitting:

```bash
bun run check          # Biome + TypeScript + package.json
bun test               # Run all tests
bun test --coverage    # Check coverage
```

### Git Hooks

Pre-commit hooks run automatically:

- Biome formatting and linting
- package.json formatting

**Never bypass hooks** with `--no-verify`

### Local Testing

Test with MCP Inspector:

```bash
bun run inspect
```

### Architecture

For codebase architecture, patterns, and technical details, see [AGENTS.md](./AGENTS.md).

## Getting Help

### Documentation

- **Users**: [README.md](./README.md)
- **Developers**: [AGENTS.md](./AGENTS.md)
- **API Reference**: [API.md](./docs/API.md)
- **You.com Docs**: https://documentation.you.com

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **Email**: support@you.com
- **Web Support**: https://you.com/support/contact-us

### Maintainer Response Time

We aim to:

- Acknowledge issues within 48 hours
- Review PRs within 1 week
- Respond to questions within 3 business days

## Recognition

Contributors are recognized through:

- Co-authorship in commits (Git)
- Attribution in release notes
- GitHub contributor graph
- Acknowledgment in project documentation

## Types of Contributions We Value

Beyond code, we appreciate:

- 📝 Documentation improvements
- 🐛 Bug reports with clear reproduction steps
- 💡 Feature ideas and use case feedback
- 🧪 Test coverage improvements
- 🎨 UX/DX enhancements
- 📢 Spreading the word about the project

---

**Thank you for contributing to You.com MCP Server!** 🎉
