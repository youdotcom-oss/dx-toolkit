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

On success the tool's structured output is printed as JSON and the process
exits `0`. If the tool returns an error (`isError`) or omits structured
content, a message is printed to stderr and the process exits non-zero.

## Flags

- `--api-key <key>`
  Uses that API key instead of `YDC_API_KEY`.
- `--dry-run`
  Prints the resolved URL, tool id, sanitized headers, and JSON arguments.
- `--profile <name>`
  Routes to `?profile=<name>` for any hosted profile. The You.com MCP server
  applies the profile's tool ceiling and intersects it with the requested tool.
  When an API key is available, `Authorization: Bearer ...` is sent regardless of
  the profile (including `free`, which ignores the header on the server side).
- `-h, --help`
  Prints usage, available commands, tools, and flags, then exits.

## Environment

- `YDC_API_KEY`
  Optional default API key.
- `YDC_ALLOWED_TOOLS`
  Optional comma-separated hosted tool ids. Consulted whenever set, independent
  of whether an API key is configured.

## Notes

- `ydc tools` is local/offline and reads the checked-in contract from `src/tools.ts`.
- `ydc schema ...` and tool execution create a fresh MCP client per invocation.
- Tool ids are literal remote MCP tool ids such as `you-search` and `you-contents`.
- CLI requests always target the hosted base MCP URL at `https://api.you.com/mcp`.
