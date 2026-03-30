# @youdotcom-oss/api

> You.com API client with bundled CLI for AI agents that can use bash commands

Fast, lightweight API client and CLI tools for web search, research, and content extraction. Optimized for AI agents supporting the [Agent Skills Spec](https://agentskills.io/home) with built-in support for calling bash commands.

## Features

- **⚡ Faster than builtin search APIs** - Optimized infrastructure for agent workloads
- **🔬 Research** - Comprehensive answers with cited sources and multi-step reasoning
- **🔄 Livecrawl** - Search AND extract content in one API call
- **✅ Verifiable references** - Every result includes citation URLs
- **📱 Agent skills optimized** - JSON output for bash pipelines (jq, grep, awk)
- **🛠️ Dual interface** - CLI tools AND programmatic TypeScript API
- **🪶 Lightweight** - No heavy dependencies, just Zod for validation

## Installation

```bash
# Bun (recommended for CLI)
bun add @youdotcom-oss/api

# npm
npm install @youdotcom-oss/api

# yarn
yarn add @youdotcom-oss/api

# pnpm
pnpm add @youdotcom-oss/api
```

**Install globally:**
```bash
bun i -g @youdotcom-oss/api
```

## Setup

Get your API key and set environment variables:

1. **Get API Key**: Visit https://you.com/platform/api-keys and create a new API key
2. **Set environment**:
   ```bash
   export YDC_API_KEY="your-api-key"
   export YDC_CLIENT="YourAgentName"  # Optional: identifies your app for tracking
   ```

## Quick Start

### Using the CLI

**No installation needed** — try with `bunx`:
```bash
bunx @youdotcom-oss/api search '{"query":"AI developments"}' --client ClaudeCode
```

**Use the `ydc` command:**
```bash
# Search the web and news
ydc search '{"query":"AI developments this past week"}' --client ClaudeCode

# Get comprehensive answers with cited sources
ydc research '{"input":"What happened in AI this week?","research_effort":"deep"}'

# Extract content from URLs
ydc contents '{"urls":["https://example.com"],"formats":["markdown"]}'

# Discover available parameters
ydc search --help
```

**Pipe JSON via stdin**
```bash
echo '{"query":"AI"}' | ydc search
```

### Using Programmatically

```typescript
import { fetchSearchResults } from '@youdotcom-oss/api';

const getUserAgent = () => 'MyApp/1.0.0 (You.com)';

const results = await fetchSearchResults({
  searchQuery: { query: 'AI developments', livecrawl: 'web' },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

console.log(results.results.web);
```

## CLI Reference

**Unix-style JSON input**: This CLI is optimized for AI agents using bash commands. All query parameters are passed as JSON via positional argument or stdin pipe.

### Commands

```bash
ydc search '{"query":"..."}'
ydc research '{"input":"...","research_effort":"standard"}'
ydc contents '{"urls":["..."]}'
```

### Global Options

- `--api-key <key>` - You.com API key (overrides YDC_API_KEY)
- `--client <name>` - Client name for tracking (overrides YDC_CLIENT)
- `--schema <input|output>` - Output JSON schema and exit
- `--dry-run` - Show request details without making API call
- `--help, -h` - Show help (per-command with `ydc <cmd> --help`)

### Schema Discovery

Use `--schema` and `--help` to discover what parameters each command accepts:

```bash
# Per-command help with parameter table
ydc search --help
ydc research --help

# Get input schema for search command
ydc search --schema input

# Get response schema
ydc search --schema output

# Default: --schema without value shows input schema
ydc search --schema
```

### Search Command

```bash
ydc search '{"query":"..."}' [options]

Examples:
  # Basic search
  ydc search '{"query":"machine learning"}' --client ClaudeCode

  # Search with livecrawl (KEY FEATURE)
  ydc search '{
    "query":"documentation",
    "livecrawl":"web",
    "livecrawl_formats":"markdown"
  }' --client ClaudeCode

  # Advanced filters
  ydc search '{
    "query":"AI papers",
    "site":"arxiv.org",
    "fileType":"pdf",
    "freshness":"month",
    "count":10
  }' --client ClaudeCode

  # Parse with jq
  ydc search '{"query":"AI"}' --client ClaudeCode | \
    jq -r '.results.web[] | .title'

  # Extract livecrawl content
  ydc search '{
    "query":"docs",
    "livecrawl":"web",
    "livecrawl_formats":"markdown"
  }' --client ClaudeCode | \
    jq -r '.results.web[0].contents.markdown'
```

**Available search parameters** (use `--help` to see full parameter table):
- `query` (required) - Search query string
- `count` - Max results per section (1-100)
- `offset` - Pagination offset (0-9)
- `freshness` - day/week/month/year or date range (YYYY-MM-DDtoYYYY-MM-DD)
- `country` - Country code (e.g., US, GB)
- `safesearch` - off/moderate/strict
- `site` - Filter to specific domain
- `fileType` - Filter by file type
- `language` - ISO 639-1 language code
- `exclude_terms` - Exclude terms (pipe-separated)
- `exact_terms` - Exact match terms (pipe-separated)
- `livecrawl` - Live-crawl sections: web/news/all
- `livecrawl_formats` - html/markdown

### Research Command

```bash
ydc research '{"input":"..."}' [options]

Examples:
  # Standard research (default effort)
  ydc research '{"input":"What is quantum computing?"}' --client ClaudeCode

  # Thorough research (takes longer)
  ydc research '{
    "input":"Latest breakthroughs in AI agents",
    "research_effort":"deep"
  }' --client ClaudeCode

  # Parse answer and sources
  ydc research '{
    "input":"AI trends 2026"
  }' --client ClaudeCode | \
    jq -r '.output.content, "\nSources:", (.output.sources[]? | "- \(.title): \(.url)")'

  # Pipe via stdin
  echo '{"input":"Explain WebAssembly"}' | ydc research
```

**Available research parameters** (use `--help` to see full parameter table):
- `input` (required) - Research question requiring in-depth investigation
- `research_effort` - Effort level: `lite` (fast), `standard` (default), `deep` (thorough), `exhaustive` (most comprehensive)

### Contents Command

```bash
ydc contents '{"urls":["..."]}' [options]

Examples:
  # Extract markdown
  ydc contents '{
    "urls":["https://example.com"],
    "formats":["markdown"]
  }' --client ClaudeCode

  # Multiple formats
  ydc contents '{
    "urls":["https://example.com"],
    "formats":["markdown","html","metadata"]
  }' --client ClaudeCode

  # Multiple URLs
  ydc contents '{
    "urls":["https://a.com","https://b.com"],
    "formats":["markdown"]
  }' --client ClaudeCode

  # Save to file
  ydc contents '{
    "urls":["https://example.com"],
    "formats":["markdown"]
  }' --client ClaudeCode | \
    jq -r '.[0].markdown' > output.md

  # With timeout
  ydc contents '{
    "urls":["https://example.com"],
    "formats":["markdown","metadata"],
    "crawl_timeout":30
  }' --client ClaudeCode
```

**Available contents parameters** (use `--help` to see full parameter table):
- `urls` (required) - Array of URLs to extract
- `formats` - Array of formats: markdown, html, metadata
- `crawl_timeout` - Timeout in seconds (1-60)

## Output Format

**Stdout/stderr separation** - The CLI uses stream separation to indicate success/failure:

- **Success** (exit code 0): Direct API response on stdout
  ```json
  {"results":{"web":[...]},"metadata":{...}}
  ```

- **Error** (exit code 1): Error message + mailto link on stderr
  ```
  Error: Missing required input
  mailto:support@you.com?subject=API%20Issue%20CLI...
  ```

- **Invalid args** (exit code 2): Error message on stderr

**No wrapper** - Success responses contain the direct API response without a wrapper. This makes bash pipelines simpler:

```bash
# Direct access to response fields
ydc search '{"query":"AI"}' | jq '.results.web[0].title'

# No need to unwrap .data or .success
```

## Environment Variables

- `YDC_API_KEY` - You.com API key (required)
- `YDC_CLIENT` - Default client name for tracking

## CLI Exit Codes

- `0` - Success (response on stdout)
- `1` - API error (rate limit, auth, network) - error on stderr
- `2` - Invalid arguments - error on stderr

## Programmatic API

All fetch functions accept an optional `customHeaders` parameter for passing custom HTTP headers (e.g., proxy authentication). Standard headers (`X-API-Key`, `User-Agent`) always take precedence.

### Search

```typescript
import { fetchSearchResults, SearchQuerySchema } from '@youdotcom-oss/api';

const getUserAgent = () => 'MyApp/1.0.0 (You.com)';

const response = await fetchSearchResults({
  searchQuery: {
    query: 'AI developments',
    count: 10,
    livecrawl: 'web',
    livecrawl_formats: 'markdown',
  },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
  customHeaders: { 'X-Custom': 'value' }, // optional
});

// Access results
console.log(response.results.web); // Web results with optional contents
console.log(response.results.news); // News results
console.log(response.metadata); // Query metadata
```

### Research

```typescript
import { callResearch, ResearchQuerySchema } from '@youdotcom-oss/api';

const response = await callResearch({
  researchQuery: {
    input: 'What happened in AI this week?',
    research_effort: 'deep', // lite | standard | deep | exhaustive
  },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

console.log(response.output.content); // Comprehensive answer with inline citations
console.log(response.output.sources); // Array of sources with URLs, titles, and snippets
```

### Contents

```typescript
import { fetchContents, ContentsQuerySchema } from '@youdotcom-oss/api';

const response = await fetchContents({
  contentsQuery: {
    urls: ['https://example.com'],
    formats: ['markdown', 'html', 'metadata'],
  },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

console.log(response[0].markdown); // Markdown content
console.log(response[0].html); // HTML content
console.log(response[0].metadata); // Structured metadata
```

## Bash Integration

### Error Handling

```bash
#!/usr/bin/env bash
set -e

# Capture result, check exit code
if ! result=$(ydc search '{"query":"AI developments"}' --client ClaudeCode); then
  echo "Search failed with code $?"
  exit 1
fi

# Parse success response from stdout
echo "$result" | jq .
```

### Retry on Rate Limit

```bash
#!/usr/bin/env bash
for i in {1..3}; do
  if ydc search '{"query":"AI"}' --client ClaudeCode; then
    exit 0
  fi
  [ $i -lt 3 ] && sleep 5
done
echo "Failed after 3 attempts"
exit 1
```

### Parallel Execution

```bash
#!/usr/bin/env bash
ydc search '{"query":"AI"}' --client ClaudeCode &
ydc search '{"query":"ML"}' --client ClaudeCode &
ydc search '{"query":"LLM"}' --client ClaudeCode &
wait
```

### Agent Workflow

```bash
#!/usr/bin/env bash
set -e

# Search with livecrawl
search=$(ydc search '{
  "query":"AI 2026",
  "count":5,
  "livecrawl":"web",
  "livecrawl_formats":"markdown"
}' --client ClaudeCode)

# Get comprehensive research with citations
answer=$(ydc research '{
  "input":"Summarize AI developments in 2026",
  "research_effort":"deep"
}' --client ClaudeCode)

# Extract top result URL and fetch content
url=$(echo "$search" | jq -r '.results.web[0].url')
ydc contents "{\"urls\":[\"$url\"],\"formats\":[\"markdown\"]}" \
  --client ClaudeCode | jq -r '.[0].markdown' > output.md
```

### Schema-Driven Agent

```bash
#!/usr/bin/env bash
set -e

# Discover available search parameters
ydc search --help

# Or get machine-readable schema
schema=$(ydc search --schema input)
echo "$schema" | jq '.properties | keys'

# Build query dynamically
query=$(jq -n '{
  query: "AI developments",
  count: 10,
  livecrawl: "web",
  livecrawl_formats: "markdown"
}')

# Execute search
ydc search "$query" --client ClaudeCode
```

## Agent Skills Integrations

If you'd prefer not to install this package, two zero-dependency alternatives are available as [Agent Skills](https://agentskills.io/home) — that teach your agent how to interact with You.com APIs directly:

### [youdotcom-cli](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/youdotcom-cli) — no Node.js/Bun required

Uses `curl` and `jq` to call You.com APIs. Ideal when your agent environment doesn't have Node.js or Bun available, or you want to avoid any npm dependencies entirely.

```bash
npx skills add youdotcom-oss/agent-skills --skill youdotcom-cli
```

### [youdotcom-api](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/youdotcom-api) — build your own integration

Tell your agent how to integrate You.com APIs from scratch, directly into your own code (in any language) without wrapping this package. Includes full JSON schemas for all endpoints and runnable examples for each API.

```bash
npx skills add youdotcom-oss/agent-skills --skill youdotcom-api
```

### Compatible Agents

Works with any bash-capable agent supporting Agent Skills:
- **Claude Code** - Anthropic's coding tool
- **Cursor** - AI-powered code editor
- **Droid** - Factory.ai agent
- **Codex** - OpenAI's CLI agent
- **Roo Code** - VS Code extension
- And more...

## TypeScript Types

All functions are fully typed with TypeScript. Import types alongside functions:

```typescript
import type {
  SearchQuery,
  SearchResponse,
  ResearchQuery,
  ResearchResponse,
  ContentsQuery,
  ContentsApiResponse,
} from '@youdotcom-oss/api';
```

## Error Handling

All API functions throw descriptive errors:

```typescript
try {
  const results = await fetchSearchResults({
    searchQuery: { query: 'test' },
    YDC_API_KEY: process.env.YDC_API_KEY,
    getUserAgent,
  });
} catch (error) {
  if (error.message.includes('Rate limited')) {
    // Handle rate limit
  } else if (error.message.includes('Forbidden')) {
    // Handle auth error
  } else {
    // Handle other errors
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Build CLI
bun run build

# Run tests
bun test

# Type check
bun run check:types

# Format code
bun run format
```

## Related Packages

- [@youdotcom-oss/mcp](https://www.npmjs.com/package/@youdotcom-oss/mcp) - Model Context Protocol server
- [@youdotcom-oss/ai-sdk-plugin](https://www.npmjs.com/package/@youdotcom-oss/ai-sdk-plugin) - Vercel AI SDK integration
- [@youdotcom-oss/langchain](https://www.npmjs.com/package/@youdotcom-oss/langchain) - LangChain.js integration

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **API Keys**: https://you.com/platform/api-keys
- **Documentation**: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/api
- **Email**: support@you.com

## License

MIT © You.com
