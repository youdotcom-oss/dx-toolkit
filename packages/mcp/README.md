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
- `YDC_PROFILE`
  Optional. When set to `free`, routes the bridge to `https://api.you.com/mcp?profile=free`.
- `YDC_ALLOWED_TOOLS`
  Optional. Comma-separated hosted tool ids to expose through `https://api.you.com/mcp?tools=...`.

`YDC_PROFILE` takes precedence over `YDC_ALLOWED_TOOLS`.

## Tool exposure

The hosted MCP capability surface includes:

- `you-contents`
- `you-finance`
- `you-research`
- `you-search`

The default hosted MCP URL exposes the default tool set:

- `you-search`
- `you-research`
- `you-contents`

`you-finance` is not included in the default tool set. Request it explicitly with `tools`.

`tools` scopes the visible tool set.

Today, `profile=free` is a search-only mode. It overrides `tools` and does not expose `you-research`, `you-contents`, `you-finance`, or livecrawl.

Examples:

- Default tool set: `https://api.you.com/mcp`
- Finance only: `https://api.you.com/mcp?tools=you-finance`
- Search plus finance: `https://api.you.com/mcp?tools=you-search,you-finance`
- Free search profile: `https://api.you.com/mcp?profile=free`

## Example client config

```json
{
  "mcpServers": {
    "ydc": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": {
        "YDC_API_KEY": "<your-api-key>",
        "YDC_ALLOWED_TOOLS": "you-search,you-finance"
      }
    }
  }
}
```

Use the hosted HTTP server directly when your MCP client supports remote MCP. Use this package only when the client requires a local STDIO command.
