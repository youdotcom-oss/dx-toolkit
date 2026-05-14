# You.com DX Toolkit

Bun workspace for You.com developer packages built around the hosted MCP server at `https://api.you.com/mcp`.

## Packages

### [@youdotcom-oss/cli](./packages/cli/)
Agent-first CLI for the hosted MCP server. It exposes:

- `ydc tools`
- `ydc schema <tool> [input|output]`
- `ydc <tool> <json>`

### [@youdotcom-oss/mcp](./packages/mcp/)
Bin-only STDIO bridge for MCP clients that need a local process. It proxies STDIO traffic to the hosted You.com MCP server.

### [@youdotcom-oss/ai-sdk-plugin](./packages/ai-sdk-plugin/)
Async AI SDK tools backed by the hosted MCP server.

### [@youdotcom-oss/langchain](./packages/langchain/)
Async LangChain tools backed by the hosted MCP server.

## Setup

```bash
bun install
cp .env.example .env
source .env
```

Most local work uses `YDC_API_KEY`.

## Commands

Run workspace commands from the repo root:

```bash
bun run build
bun test
bun run check
```

Run package-local commands from the repo root with `bun --cwd`:

```bash
bun --cwd packages/cli test
bun --cwd packages/cli check
bun --cwd packages/mcp test
bun --cwd packages/mcp check
bun --cwd packages/ai-sdk-plugin test
bun --cwd packages/langchain test
```

## Notes

- The hosted MCP server is the shared execution path across framework integrations and the CLI.
- `packages/cli/src/tools.ts` is generated contract data for the checked-in allowlist.
- `packages/mcp` is bridge-only and no longer exposes local tool registration code.

Contributor workflow details live in [AGENTS.md](./AGENTS.md).
