# @youdotcom-oss/api

> You.com API client with bundled CLI for AI agents that can use bash commands

Fast, lightweight API client and CLI tools for web search, AI answers, and content extraction. Optimized for AI agents supporting the [Agent Skills Spec](https://agentskills.io/home) with built-in support for calling bash commands.

## Features

- **⚡ Faster than builtin search APIs** - Optimized infrastructure for agent workloads
- **🔄 Livecrawl** - Search AND extract content in one API call
- **✅ Verifiable references** - Every result includes citation URLs
- **📱 Agent skills optimized** - JSON output for bash pipelines (jq, grep, awk)
- **🛠️ Dual interface** - CLI tools AND programmatic TypeScript API
- **🪶 Lightweight** - No heavy dependencies, just Zod for validation

## Quick Start

### CLI Usage

```bash
# Use with bunx (no install needed) - Schema-driven JSON input
bunx @youdotcom-oss/api search --json '{"query":"AI developments"}' --client ClaudeCode

# Or install globally to use 'ydc' command
bun i -g @youdotcom-oss/api
ydc search --json '{"query":"AI developments"}' --client ClaudeCode

# Get comprehensive research with citations
bunx @youdotcom-oss/api deep-search --json '{
  "query":"What happened in AI this week?",
  "search_effort":"high"
}' --client MyAgent

# Extract web content
bunx @youdotcom-oss/api contents --json '{
  "urls":["https://example.com"],
  "formats":["markdown"]
}' --client MyAgent

# Discover available parameters with --schema
ydc search --schema | jq '.properties | keys'
```

### Programmatic Usage

```typescript
import { fetchSearchResults } from '@youdotcom-oss/api';

const getUserAgent = (client: string) => `MyApp/${client} (You.com; 1.0.0)`;

const results = await fetchSearchResults({
  searchQuery: { query: 'AI developments', livecrawl: 'web' },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

console.log(results.results.web);
```

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

**Global installation for CLI:**
```bash
bun i -g @youdotcom-oss/api
```

## Setup

**Get API Key:**
1. Visit https://you.com/platform/api-keys
2. Create new API key
3. Set environment variable:

```bash
export YDC_API_KEY="your-api-key"
export YDC_CLIENT="YourAgentName"  # Optional: default client for tracking
```

## CLI Reference

**Schema-driven JSON input**: This CLI is optimized for AI agents using bash commands. All query parameters are passed as JSON via the required `--json` flag.

### Commands

All commands require the `--json` flag with a JSON string containing the query parameters:

```bash
ydc search --json '{"query":"..."}'
ydc deep-search --json '{"query":"...","search_effort":"medium"}'
ydc contents --json '{"urls":["..."]}'
```

### Global Options

- `--json <json>` - **Required**. JSON string with command parameters
- `--api-key <key>` - You.com API key (overrides YDC_API_KEY)
- `--client <name>` - Client name for tracking (overrides YDC_CLIENT)
- `--schema` - Output JSON schema for what can be passed to --json
- `--dry-run` - Show request details without making API call
- `--help, -h` - Show help

### Schema Discovery

Use `--schema` to discover what parameters each command accepts:

```bash
# Get schema for search command
ydc search --schema

# Get schema for deep-search command
ydc deep-search --schema

# Get schema for contents command
ydc contents --schema
```

The schema output describes the JSON structure to pass via `--json`.

### Search Command

```bash
ydc search --json '{"query":"..."}' [options]

Examples:
  # Basic search
  ydc search --json '{"query":"machine learning"}' --client ClaudeCode

  # Search with livecrawl (KEY FEATURE)
  ydc search --json '{
    "query":"documentation",
    "livecrawl":"web",
    "livecrawl_formats":"markdown"
  }' --client ClaudeCode

  # Advanced filters
  ydc search --json '{
    "query":"AI papers",
    "site":"arxiv.org",
    "fileType":"pdf",
    "freshness":"month",
    "count":10
  }' --client ClaudeCode

  # Parse with jq
  api search --json '{"query":"AI"}' --client ClaudeCode | \
    jq -r '.results.web[] | .title'

  # Extract livecrawl content
  api search --json '{
    "query":"docs",
    "livecrawl":"web",
    "livecrawl_formats":"markdown"
  }' --client ClaudeCode | \
    jq -r '.results.web[0].contents.markdown'
```

**Available search parameters** (use `--schema` to see full schema):
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

### Deep-Search Command

```bash
ydc deep-search --json '{"query":"..."}' [options]

Examples:
  # Comprehensive research with medium effort
  api deep-search --json '{"query":"What is quantum computing?"}' --client ClaudeCode

  # High-effort deep research (up to 5 minutes)
  api deep-search --json '{
    "query":"Latest breakthroughs in AI agents",
    "search_effort":"high"
  }' --client ClaudeCode

  # Parse answer and sources
  api deep-search --json '{
    "query":"AI trends 2026"
  }' --client ClaudeCode | \
    jq -r '.answer, "\nSources:", (.results[]? | "- \(.title): \(.url)")'
```

**Available deep-search parameters** (use `--schema` to see full schema):
- `query` (required) - Research question requiring in-depth investigation
- `search_effort` - Computation budget: `low` (<30s), `medium` (<60s, default), `high` (<300s)

### Contents Command

```bash
ydc contents --json '{"urls":["..."]}' [options]

Examples:
  # Extract markdown
  api contents --json '{
    "urls":["https://example.com"],
    "formats":["markdown"]
  }' --client ClaudeCode

  # Multiple formats
  api contents --json '{
    "urls":["https://example.com"],
    "formats":["markdown","html","metadata"]
  }' --client ClaudeCode

  # Multiple URLs
  api contents --json '{
    "urls":["https://a.com","https://b.com"],
    "formats":["markdown"]
  }' --client ClaudeCode

  # Save to file
  api contents --json '{
    "urls":["https://example.com"],
    "formats":["markdown"]
  }' --client ClaudeCode | \
    jq -r '.[0].markdown' > output.md

  # With timeout
  api contents --json '{
    "urls":["https://example.com"],
    "formats":["markdown","metadata"],
    "crawl_timeout":30
  }' --client ClaudeCode
```

**Available contents parameters** (use `--schema` to see full schema):
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
  Error: --json flag is required
      at searchCommand (/path/to/search.ts:26:11)
  mailto:support@you.com?subject=API%20Issue%20CLI...
  ```

- **Invalid args** (exit code 2): Error message on stderr

**No wrapper** - Success responses contain the direct API response without a wrapper. This makes bash pipelines simpler:

```bash
# Direct access to response fields
ydc search --json '{"query":"AI"}' | jq '.results.web[0].title'

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

### Search

```typescript
import { fetchSearchResults, SearchQuerySchema } from '@youdotcom-oss/api';

const getUserAgent = (client: string) => `MyApp/${client} (You.com; 1.0.0)`;

const response = await fetchSearchResults({
  searchQuery: {
    query: 'AI developments',
    count: 10,
    livecrawl: 'web',
    livecrawl_formats: 'markdown',
  },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

// Access results
console.log(response.results.web); // Web results with optional contents
console.log(response.results.news); // News results
console.log(response.metadata); // Query metadata
```

### Deep-Search

```typescript
import { callDeepSearch, DeepSearchQuerySchema } from '@youdotcom-oss/api';

const response = await callDeepSearch({
  deepSearchQuery: {
    query: 'What happened in AI this week?',
    search_effort: 'high', // low | medium | high
  },
  YDC_API_KEY: process.env.YDC_API_KEY,
  getUserAgent,
});

console.log(response.answer); // Comprehensive answer with inline citations
console.log(response.results); // Array of sources with URLs, titles, and snippets
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
if ! result=$(api search --json '{"query":"AI developments"}' --client ClaudeCode); then
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
  if api search --json '{"query":"AI"}' --client ClaudeCode; then
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
ydc search --json '{"query":"AI"}' --client ClaudeCode &
ydc search --json '{"query":"ML"}' --client ClaudeCode &
ydc search --json '{"query":"LLM"}' --client ClaudeCode &
wait
```

### Agent Workflow

```bash
#!/usr/bin/env bash
set -e

# Search with livecrawl
search=$(api search --json '{
  "query":"AI 2026",
  "count":5,
  "livecrawl":"web",
  "livecrawl_formats":"markdown"
}' --client ClaudeCode)

# Get comprehensive research with citations
answer=$(api deep-search --json '{
  "query":"Summarize AI developments in 2026",
  "search_effort":"high"
}' --client ClaudeCode)

# Extract top result URL and fetch content
url=$(echo "$search" | jq -r '.results.web[0].url')
ydc contents --json "{\"urls\":[\"$url\"],\"formats\":[\"markdown\"]}" \
  --client ClaudeCode | jq -r '.[0].markdown' > output.md
```

### Schema-Driven Agent

```bash
#!/usr/bin/env bash
set -e

# Discover available search parameters
schema=$(api search --schema)
echo "$schema" | jq '.properties | keys'

# Build query dynamically
query=$(jq -n '{
  query: "AI developments",
  count: 10,
  livecrawl: "web",
  livecrawl_formats: "markdown"
}')

# Execute search
ydc search --json "$query" --client ClaudeCode
```

## Agent Skills Integration

This package is designed for agents that support the [Agent Skills Spec](https://agentskills.io/home). The **youdotcom-cli** skill provides guided workflows for agents to integrate You.com capabilities.

### What Agents Get

The [youdotcom-cli skill](https://github.com/youdotcom-oss/agent-skills/tree/main/skills/youdotcom-cli) teaches agents:

- **Schema Discovery** - Use `--schema` to discover available parameters
- **Runtime Setup** - Check for Node.js/Bun, install if needed
- **API Configuration** - Set up API keys and client tracking
- **Command Patterns** - JSON-only input with compact output
- **Error Handling** - Stdout/stderr separation with exit codes
- **Advanced Workflows** - Livecrawl, parallel execution, rate limiting

### Compatible Agents

Works with any bash-capable agent supporting Agent Skills:
- **Claude Code** - Anthropic's coding tool
- **Cursor** - AI-powered code editor
- **Droid** - Factory.ai agent
- **Codex** - OpenAI's CLI agent
- **Roo Code** - VS Code extension
- And more...

### Installation for Agents

```bash
# Add skill to agent's skills directory
npx skills add youdotcom-oss/agent-skills --skill youdotcom-cli
```

**Using the CLI**: See the skill's SKILL.md for complete integration workflow.

## TypeScript Types

All functions are fully typed with TypeScript. Import types alongside functions:

```typescript
import type {
  SearchQuery,
  SearchResponse,
  DeepSearchQuery,
  DeepSearchResponse,
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

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **API Keys**: https://you.com/platform/api-keys
- **Documentation**: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/api
- **Email**: support@you.com

## License

MIT © You.com
