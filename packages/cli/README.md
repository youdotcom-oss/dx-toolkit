# @youdotcom-oss/cli

Agent-first CLI for the hosted You.com MCP server.

`ydc` exposes four primary commands that map one-to-one to You.com tools:

| Command            | Tool          | Purpose                              |
| ------------------ | ------------- | ------------------------------------ |
| `search`           | `you-search`  | Web and news search                  |
| `fetch`            | `you-contents`| Extract page content from URLs       |
| `research`         | `you-research`| Deep research with citations         |
| `finance-research` | `you-finance` | Deep finance research                |

It is a thin bridge over remote MCP at `https://api.you.com/mcp`. The CLI does
not contain local per-tool REST logic and does not validate input schemas
locally.

## Install

```bash
bun add -g @youdotcom-oss/cli
```

Or run it without installing:

```bash
bunx @youdotcom-oss/cli search "latest bun release"
```

## Quick start

```bash
export YDC_API_KEY=...

ydc search "react server components" --freshness week --count 10
ydc fetch https://you.com https://docs.you.com --formats markdown,metadata
ydc research "Compare Snowflake and Databricks pricing" --effort deep
ydc finance-research "AAPL FY24 margin trend" --effort exhaustive
```

## Primary commands

### `ydc search <query>`

Web and news search via `you-search`.

| Flag                       | Type    | Description                                         |
| -------------------------- | ------- | --------------------------------------------------- |
| `--count <int>`            | int     | Max results per section (1-100)                     |
| `--offset <int>`           | int     | Pagination offset (0-9)                             |
| `--freshness <value>`      | string  | `day` \| `week` \| `month` \| `year` \| `YYYY-MM-DDtoYYYY-MM-DD` |
| `--country <code>`         | string  | ISO country code                                    |
| `--language <code>`        | string  | BCP 47 language code                                |
| `--safesearch <value>`     | string  | `off` \| `moderate` \| `strict`                     |
| `--livecrawl <value>`      | string  | `web` \| `news` \| `all`                            |
| `--livecrawl-formats <csv>`| csv     | `html`, `markdown`                                  |
| `--include-domains <csv>`  | csv     | Domains to include (max 500)                        |
| `--exclude-domains <csv>`  | csv     | Domains to exclude (max 500)                        |
| `--crawl-timeout <int>`    | int     | Live-crawl timeout in seconds (1-60)                |
| `--profile free`           | string  | Free search profile (no API key required)           |

```bash
ydc search "AI startups funding" --freshness week --count 15
ydc search "machine learning" --include-domains arxiv.org,nature.com
ydc search "openai" --profile free
```

### `ydc fetch <url> [<url>...]`

Extract page content via `you-contents`. Reads URLs from positional arguments
or whitespace-separated stdin when no positionals are given.

| Flag                    | Type | Description                                |
| ----------------------- | ---- | ------------------------------------------ |
| `--formats <csv>`       | csv  | `markdown`, `html`, `metadata` (default: `markdown`) |
| `--crawl-timeout <int>` | int  | Crawl timeout in seconds (1-60)            |

```bash
ydc fetch https://example.com --formats markdown,metadata
echo "https://example.com https://other.com" | ydc fetch
```

### `ydc research <input>`

Deep research with citations via `you-research`.

| Flag               | Type   | Description                                           |
| ------------------ | ------ | ----------------------------------------------------- |
| `--effort <value>` | string | `lite` \| `standard` \| `deep` \| `exhaustive` (default: `standard`) |

```bash
ydc research "Compare warehouses for analytics workloads" --effort deep
```

### `ydc finance-research <input>`

Deep finance research via `you-finance`. Investigates SEC filings, earnings,
financial data, and company metrics.

| Flag               | Type   | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| `--effort <value>` | string | `deep` \| `exhaustive` (default: `deep`) |

```bash
ydc finance-research "AAPL FY24 margin trend vs MSFT" --effort exhaustive
```

## Global flags

These work with every command:

| Flag                | Description                                       |
| ------------------- | ------------------------------------------------- |
| `--api-key <key>`   | Use this key instead of `YDC_API_KEY`             |
| `-o, --output <file>` | Write JSON output to file                       |
| `--pretty`          | Pretty-print JSON output                          |
| `--dry-run`         | Print the resolved request without executing it   |
| `-h, --help`        | Show help (top-level or per-command)              |
| `-V, --version`     | Show CLI version                                  |

```bash
ydc search "AI agents" --pretty -o results.json
ydc research "..." --dry-run --api-key sk-test
```

## Utilities

### `ydc tools`

Print the local tool contract and the command-to-tool map.

```bash
ydc tools --pretty
```

### `ydc schema <tool> [input|output]`

Print the live JSON Schema for a tool. Defaults to the input schema.

```bash
ydc schema you-search
ydc schema you-finance output --pretty
```

### `ydc raw <tool> [<json>]`

Escape hatch for calling any tool with raw JSON arguments. Reads JSON from
stdin when the positional argument is omitted.

```bash
ydc raw you-search '{"query":"latest bun release","count":5}'
echo '{"query":"hi"}' | ydc raw you-search
```

## Environment

- `YDC_API_KEY` Optional default API key. Sent as `Authorization: Bearer <key>`.

## Output behavior

- All commands print JSON to stdout. Use `--pretty` for pretty-printing or
  `-o <file>` to write to a file.
- The `--profile free` mode strips the `Authorization` header so the CLI never
  sends credentials when routing through the free profile.

## Notes

- `ydc tools` is local/offline and reads the checked-in contract from
  `src/tools.ts`.
- All other commands create a fresh MCP client per invocation against
  `https://api.you.com/mcp`, scoped to the relevant tool via `?tools=...` (or
  `?profile=free` for free search).
