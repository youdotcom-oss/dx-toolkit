# You.com DX Toolkit Roadmap

Packages and plugins planned for the dx-toolkit monorepo.

---

## Packages in Development (Target: 12/16/2025)

### @youdotcom-oss/openai-sdk-plugin

**Type**: NPM Package

OpenAI SDK integration for You.com web search and AI agents - similar API to ai-sdk-plugin but for OpenAI's official SDK.

**Features**:
- Real-time web search integration with OpenAI models
- AI-powered answers with web context
- Content extraction from web pages
- Works with all OpenAI SDK-compatible providers

**Status**: In Development

---

### @youdotcom-oss/claude-agent-sdk

**Type**: NPM Package

Claude Agent SDK patterns and orchestration utilities for building production-ready AI agents.

**Features**:
- Agent orchestration patterns for Claude Code
- MCP server integration helpers
- Type-safe agent configuration
- Production-ready error handling and retry logic

**Status**: In Development

---

## Plugins in Development (Q1 2026)

**google-chat-anthropic-integration** (Enterprise Integration)
- **Type**: Plugin
- Generate Google Chat apps with You.com Anthropic integration
- Similar to teams-anthropic-integration but for Google Chat
- Template-based setup workflow
- Status: Planned Q1 2026

**eval-harness** (Workflow)
- **Type**: Plugin + Skills
- Evaluation harness for MCP tools
- Benchmark and validate MCP tool performance
- Automated testing framework
- Includes Claude Code skills for evaluation patterns
- Status: Planned Q1 2026

**local-rag-sqlite** (Workflow)
- **Type**: Plugin + Skills
- Local RAG with SQLite backend
- Build retrieval-augmented generation workflows
- Embedded database for fast local development
- Includes Claude Code skills for RAG patterns
- Status: Planned Q1 2026

**rl-pipeline** (Workflow)
- **Type**: Plugin + Skills
- Reinforcement learning pipeline starter
- Production-ready RL templates
- Training and evaluation workflows
- Includes Claude Code skills for RL patterns
- Status: Planned Q1 2026

**cloud-deployment** (Deployment)
- **Type**: Plugin + Skills
- Cloud-agnostic deployment automation
- Support for GCP, Azure, and Databricks
- Unified deployment workflows
- Includes Claude Code skills for deployment patterns
- Status: Planned Q1 2026

---

## Contributing Ideas

Have ideas for new packages or plugins? We welcome suggestions!

1. Check existing [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
2. Open a new issue with your proposal
3. Include:
   - Use case and benefits
   - Target audience
   - Integration points
   - Example workflows

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Release Timeline

**Q1 2026**: Focus on enterprise integrations and workflow automation
- Google Chat MCP integration
- Evaluation harness
- Local RAG with SQLite
- Cloud deployment automation
- RL pipeline starter

Timeline subject to change based on community needs and priorities.
