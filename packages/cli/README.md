# @youdotcom-oss/cli

Agent-first CLI for the hosted You.com MCP server.

The CLI is a thin bridge over remote MCP:

- `ydc tools`
- `ydc schema <tool> [input|output]`
- `ydc <tool> <json>`

It does not contain local per-tool REST logic or local schema validation.

## Install

**Bun**
```bash
bun add -g @youdotcom-oss/cli
```
**Node**
```bash
npm add -g @youdotcom-oss/cli
```

Or run it without installing:

**Bun**
```bash
bunx @youdotcom-oss/cli tools
```
**Node**
```bash
npx @youdotcom-oss/cli tools
```

## Commands

List the locally allowlisted tool ids:

```bash
ydc tools
```

Fetch raw remote schema for a tool:

```bash
ydc schema you-search
ydc schema you-search output
```

Execute a remote tool with JSON input:

```bash
ydc you-search '{"query":"latest bun release"}'
echo '{"query":"latest bun release"}' | ydc you-search
```

## Flags

- `--api-key <key>`
  Uses that API key instead of `YDC_API_KEY`.
- `--dry-run`
  Prints the resolved URL, tool id, sanitized headers, and JSON arguments.
- `--profile free`
  Supported only for `you-search`. In this mode the CLI routes to `?profile=free` and strips auth headers.
- `-h, --help`
  Prints usage, available commands, tools, and flags, then exits.

## Environment

- `YDC_API_KEY`
  Optional default API key.

## Notes

- `ydc tools` is local/offline and reads the checked-in contract from `src/tools.ts`.
- `ydc schema ...` and tool execution create a fresh MCP client per invocation.
- Tool ids are literal remote MCP tool ids such as `you-search` and `you-contents`.
- CLI requests always target the hosted base MCP URL at `https://api.you.com/mcp`.
