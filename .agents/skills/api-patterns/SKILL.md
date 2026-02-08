---
name: api-patterns
description: Foundation API package patterns - CLI tool, shared utilities, Zod schemas, and type-safe building blocks used by MCP and AI SDK packages
license: MIT
compatibility: Bun >= 1.2.21
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [api, cli, zod, schemas, utilities, foundation]
---

# API Package Development Patterns

Foundation package for You.com API - CLI tool and shared utilities used by MCP and AI SDK plugin packages.

> **For end users**: See [packages/api/README.md](../../packages/api/README.md)  
> **For universal patterns**: See [`.agents/rules/core.md`](../../.agents/rules/core.md)

## When to Use

- Contributing to `@youdotcom-oss/api` package
- Adding new You.com API endpoints
- Understanding how MCP/AI SDK packages consume shared utilities
- Implementing CLI commands

## Architecture

**Foundation Layer** - Other packages build on this:
```
@youdotcom-oss/api (Foundation)
├── CLI commands (search, deep-search, contents)
├── API utilities (fetch*, format*, call*)
├── Zod schemas (*Schema)
└── Type definitions (types.ts)
         ↓
    Used by MCP, AI SDK Plugin
```

**When adding new APIs:**
1. Add to API package FIRST (schemas, utils, types)
2. THEN expose via MCP tools or AI SDK tools
3. Keep foundation logic in API package

## Tech Stack

- **Runtime**: Bun >= 1.2.21
- **Validation**: Zod ^4.3.5
- **Testing**: Bun test
- **CLI Binary**: `bin/cli.js` (compiled from `src/cli.ts`)

## Quick Start

```bash
cd packages/api
bun install
bun test
bun run check
```

## Package-Specific Patterns

### CLI Command Pattern

**Structure**: Each command in `src/cli.ts` uses shared utilities:

```typescript
// ✅ CLI wraps shared utility
case 'search': {
  const result = await fetchSearchResults({ params, YDC_API_KEY, getUserAgent });
  console.log(formatSearchResults(result));
  break;
}

// ❌ Don't duplicate logic in CLI
case 'search': {
  const response = await fetch(/* ... */);  // Wrong - use shared utility
}
```

**Why**: CLI is thin wrapper, logic stays in shared utilities for reuse

*Verify:* `grep -c 'await fetch(' src/cli.ts` should be 0  
*Fix:* Move fetch logic to `src/*/utils.ts`, import in CLI

### Schema First Design

**ALL API endpoints need Zod schemas BEFORE implementation:**

```typescript
// ✅ Define schema first
export const SearchQuerySchema = z.object({
  query: z.string().describe('Search query'),
  count: z.number().int().min(1).max(20).default(10),
});

// Then use in utility
export const fetchSearchResults = async (params: z.infer<typeof SearchQuerySchema>) => {
  const validated = SearchQuerySchema.parse(params);
  // ...
};
```

*Verify:* Every `fetch*` function has matching `*Schema` export  
*Fix:* Create schema in `src/*/*.schemas.ts` before implementing utility

### Shared Utility Export Pattern

**Public API** (`src/main.ts`) exports ONLY reusable pieces:

```typescript
// ✅ Export for consumption by MCP/AI SDK
export * from './search/search.schemas.ts';
export * from './search/search.utils.ts';
export * from './shared/api.types.ts';

// ❌ Don't export CLI-specific code
export * from './cli.ts';  // Wrong - CLI is binary, not library
```

*Verify:* `grep "from './cli" src/main.ts` returns nothing  
*Fix:* Remove CLI exports from main.ts

### Error Handling

**API utilities throw descriptive errors for better debugging:**

```typescript
// ✅ Throw with context
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(`Failed to perform search. Error code: ${errorData.code}`);
}

// ✅ Preserve error context in catch blocks
try {
  const response = await fetch(url);
  return await response.json();
} catch (err: unknown) {
  throw new Error(`API request failed: ${err instanceof Error ? err.message : String(err)}`);
}

// ❌ Don't silently fail
if (!response.ok) {
  return { error: 'failed' };  // Loses context
}
```

*Verify:* Check error messages include context (status codes, error codes, URLs)
*Fix:* Add descriptive error messages with relevant context

### User-Agent Pattern

**ALL API calls use `getUserAgent()`:**

```typescript
// ✅ Always include User-Agent
const response = await fetch(url, {
  headers: {
    'X-API-Key': YDC_API_KEY,
    'User-Agent': getUserAgent(),
  }
});

// ❌ Missing User-Agent
const response = await fetch(url, {
  headers: { 'X-API-Key': YDC_API_KEY }
});
```

*Verify:* `grep -L "getUserAgent()" src/*/utils.ts`  
*Fix:* Add `getUserAgent()` to all fetch calls

## File Organization

```
src/
├── search/
│   ├── search.schemas.ts     # SearchQuerySchema
│   ├── search.utils.ts       # fetchSearchResults()
│   └── tests/
├── deep-search/
│   ├── deep-search.schemas.ts    # DeepSearchQuerySchema
│   ├── deep-search.utils.ts      # callDeepSearch()
│   └── tests/
├── contents/
│   ├── contents.schemas.ts   # ContentsQuerySchema
│   ├── contents.utils.ts     # fetchContents()
│   └── tests/
├── shared/
│   ├── api-constants.ts
│   ├── api.types.ts
│   ├── check-response-for-errors.ts
│   └── tests/
├── main.ts                   # Public API exports
├── cli.ts                    # CLI wrapper
└── stdio.ts                  # STDIO entry (if needed)
```

## Testing

**Test both CLI and utilities:**

```bash
bun test                      # All tests
bun test src/search/tests/    # Specific module
```

**API key required** - Set in `.env`:
```bash
echo "export YDC_API_KEY=your-key" > .env
source .env
```

## Adding New APIs

**Workflow:**
1. Create `src/{api-name}/{api-name}.schemas.ts` with Zod schemas
2. Create `src/{api-name}/{api-name}.utils.ts` with `fetch*()` functions
3. Add types to `src/shared/api.types.ts` if needed
4. Export from `src/main.ts` for library consumers
5. Add CLI command in `src/cli.ts` (optional)
6. Write tests in `src/{api-name}/tests/`
7. THEN add to MCP or AI SDK plugin packages

**Don't skip schema step** - Schemas ensure type safety for all consumers

## Publishing

Standard workflow via `.github/workflows/publish-api.yml`

See [root AGENTS.md](../../AGENTS.md#publishing)

## Related Skills

- [`.agents/rules/core.md`](../../.agents/rules/core.md) - Type over interface, arrow functions
- [`.agents/rules/bun.md`](../../.agents/rules/bun.md) - Bun APIs (Bun.file, Bun.$)
- [`.agents/rules/testing.md`](../../.agents/rules/testing.md) - Test patterns
- [`.claude/skills/mcp-patterns`](../mcp-patterns/SKILL.md) - Consumes API utilities
- [`.claude/skills/ai-sdk-plugin-patterns`](../ai-sdk-plugin-patterns/SKILL.md) - Consumes API utilities

## Contributing

Package scope: `api` in commit messages

```bash
feat(api): add image search endpoint
fix(api): handle rate limit errors
```
