# @youdotcom-oss/mcp

Bin-only STDIO bridge for the hosted You.com MCP server at `https://api.you.com/mcp`.

This package does not register tools locally and does not contain REST tool logic. Its only job is to proxy STDIO MCP traffic to the hosted remote server.

## Install

```bash
bun add @youdotcom-oss/mcp
```

Or run it directly:

```bash
npx @youdotcom-oss/mcp
```

## Environment

- `YDC_API_KEY`
  Optional. Sent as `Authorization: Bearer <key>`.
- `MCP_SERVER_URL`
  Optional. Defaults to `https://api.you.com/mcp`.

## Hosted tools

The remote MCP surface currently exposes:

- `you-contents`
- `you-finance`
- `you-research`
- `you-search`

## Example client config

```json
{
  "mcpServers": {
    "ydc": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": {
        "YDC_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

Use the hosted HTTP server directly when your MCP client supports remote MCP. Use this package only when the client requires a local STDIO command.
