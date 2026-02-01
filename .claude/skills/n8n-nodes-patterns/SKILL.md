---
name: n8n-nodes-patterns
description: n8n community node patterns - INodeType classes, Zod schema validation, credential handling, operation structure. Uses You.com API.
license: MIT
compatibility: Bun >= 1.2.21, n8n-workflow >= 2.6.0
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [n8n, community-node, zod, credentials, workflow-automation]
---

# n8n Community Node Patterns

n8n community node patterns for You.com API integration.

> **For end users**: See [packages/n8n-nodes-youdotcom/README.md](../../packages/n8n-nodes-youdotcom/README.md)
> **For universal patterns**: See [`.plaited/rules/core.md`](../../.plaited/rules/core.md)

## When to Use

- Contributing to `@youdotcom-oss/n8n-nodes-youdotcom` package
- Implementing n8n node operations
- Adding new API operations to the node

## Architecture

**n8n node wraps You.com APIs:**
```
You.com APIs (External)
├── /v1/search (Search API)
├── /v1/contents (Contents API)
└── /v1/agents/runs (Express API)
         ↓
@youdotcom-oss/n8n-nodes-youdotcom
├── YouDotCom.node.ts - INodeType implementation
├── YouDotCom.schemas.ts - Zod validation schemas
└── YouDotComApi.credentials.ts - Credential handling
```

## Tech Stack

- **n8n Workflow**: n8n-workflow ^2.6.0
- **Validation**: Zod ^4.3.6
- **Build**: Bun bundler
- **Testing**: Bun test

## Quick Start

```bash
cd packages/n8n-nodes-youdotcom
bun test
bun run check
bun run build
```

## n8n-Specific Patterns

### Class-Based Nodes (Framework Requirement)

**n8n requires classes implementing INodeType:**

```typescript
// ✅ Required by n8n framework - exception to arrow function rule
/**
 * NOTE: n8n framework requires class-based nodes that implement INodeType.
 * This is an exception to the project's arrow function convention.
 */
export class YouDotCom implements INodeType {
  description: INodeTypeDescription = { /* ... */ };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // ...
  }
}

// ❌ Arrow functions won't work with n8n
export const youDotCom = { /* ... */ };  // Wrong - n8n requires class
```

*Note:* Document the exception in TSDoc when using classes

### Private Static Methods for Operations

**Use private static methods for operation handlers:**

```typescript
export class YouDotCom implements INodeType {
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    if (operation === 'search') {
      const response = await YouDotCom.#executeSearch(this, i);
      // ...
    }
  }

  // ✅ Private static method - keeps class clean
  static async #executeSearch(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    // Operation implementation
  }
}
```

*Verify:* Operation handlers use `static async #methodName` pattern

### Zod Schema Validation

**Validate both inputs and API responses with Zod:**

```typescript
// ✅ Define schemas in separate file
// YouDotCom.schemas.ts
export const SearchOptionsSchema = z.object({
  count: z.number().int().min(1).max(100).optional(),
  country: z.string().optional(),
  // ...
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

// ✅ Validate inputs
const options = SearchOptionsSchema.parse(rawOptions);

// ✅ Validate API responses
const response = SearchResponseSchema.parse(rawResponse);

// ❌ Don't skip validation
const options = rawOptions as SearchOptions;  // Wrong - no runtime check
```

*Verify:* `grep 'Schema.parse' nodes/` shows validation for all operations

### Use passthrough() for API Responses

**Preserve unknown API fields with passthrough():**

```typescript
// ✅ Allow additional fields from API
export const SearchResponseSchema = z.object({
  results: z.object({
    web: z.array(WebResultSchema).optional(),
    news: z.array(NewsResultSchema).optional(),
  }).passthrough(),  // Preserve extra fields
  metadata: MetadataSchema.optional(),
}).passthrough();

// ❌ Don't use strict() - may break when API adds fields
const schema = z.object({ /* ... */ }).strict();  // Wrong
```

*Why:* APIs may add new fields; passthrough() prevents breaking changes

### Credential Handling

**Credentials use X-API-Key header by default:**

```typescript
// ✅ Credentials class with authenticate config
export class YouDotComApi implements ICredentialType {
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };
}

// ✅ Use httpRequestWithAuthentication for standard auth
const response = await context.helpers.httpRequestWithAuthentication.call(
  context,
  'youDotComApi',  // credential name
  { method: 'GET', url: '...', qs }
);

// ✅ For different auth (e.g., Bearer), get credentials manually
const credentials = await context.getCredentials('youDotComApi');
const apiKey = credentials.apiKey as string;
await context.helpers.httpRequest({
  headers: { Authorization: `Bearer ${apiKey}` },
  // ...
});
```

*Pattern:* Use `httpRequestWithAuthentication` for X-API-Key, manual for Bearer

### Error Handling with continueOnFail

**Support n8n's continueOnFail option:**

```typescript
try {
  const response = await YouDotCom.#executeSearch(this, i);
  returnData.push(...executionData);
} catch (error) {
  // ✅ Handle Zod validation errors with details
  if (error instanceof ZodError) {
    const errorMessage = `Validation error:\n${error.issues.map((e, i) =>
      `  ${i + 1}. ${e.path.join('.') || 'root'}: ${e.message}`
    ).join('\n')}`;

    if (this.continueOnFail()) {
      returnData.push({
        json: { error: errorMessage, validationErrors: serializedIssues },
        pairedItem: { item: i },
      });
      continue;
    }
    throw new NodeApiError(this.getNode(), { message: errorMessage } as JsonObject, {
      itemIndex: i,
    });
  }

  // ✅ Handle other errors
  if (this.continueOnFail()) {
    returnData.push({
      json: { error: (error as Error).message },
      pairedItem: { item: i },
    });
    continue;
  }
  throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
}
```

*Verify:* All operations check `this.continueOnFail()` before throwing

### User-Agent Header

**Include package version in User-Agent:**

```typescript
// ✅ Identify requests with package info
const PACKAGE_VERSION = '0.1.0';
const USER_AGENT = `n8n-nodes-youdotcom/${PACKAGE_VERSION} (https://github.com/youdotcom-oss/dx-toolkit)`;

// Use in requests
headers: { 'User-Agent': USER_AGENT }
```

*Update:* Bump PACKAGE_VERSION when publishing new versions

## File Organization

```
packages/n8n-nodes-youdotcom/
├── src/
│   └── main.ts                  # Package exports
├── nodes/
│   └── YouDotCom/
│       ├── YouDotCom.node.ts    # INodeType implementation
│       ├── YouDotCom.node.json  # Node metadata
│       ├── YouDotCom.schemas.ts # Zod validation schemas
│       └── youdotcom.svg        # Node icon
├── credentials/
│   └── YouDotComApi.credentials.ts  # ICredentialType
├── tests/
│   └── *.spec.ts                # Unit tests
└── dist/                        # Built output
```

## Build Configuration

**Bundle JS and generate types separately:**

```json
{
  "scripts": {
    "build": "bun run build:js && bun run build:types && bun run build:assets",
    "build:js": "bun build ./src/main.ts --outfile ./dist/main.js --target=node",
    "build:assets": "cp nodes/YouDotCom/youdotcom.svg dist/nodes/YouDotCom/"
  }
}
```

**n8n package.json config:**

```json
{
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/YouDotComApi.credentials.js"],
    "nodes": ["dist/nodes/YouDotCom/YouDotCom.node.js"]
  }
}
```

## Troubleshooting

**Node not appearing in n8n:**
```bash
bun run build  # Ensure dist/ is built
# Check n8n config points to dist/ paths
```

**Validation errors:**
- Check Zod schema matches API response structure
- Use passthrough() for flexible response schemas

**Credential test failing:**
```bash
# Verify API key is valid
curl -H "X-API-Key: $YDC_API_KEY" "https://ydc-index.io/v1/search?query=test&count=1"
```

## Related Skills

- [`.plaited/rules/core.md`](../../.plaited/rules/core.md) - Code patterns
- [`.plaited/rules/testing.md`](../../.plaited/rules/testing.md) - Test patterns
- [`.claude/skills/api-patterns`](../api-patterns/SKILL.md) - API utilities reference

## Contributing

Package scope: `n8n` in commits

```bash
feat(n8n): add new operation
fix(n8n): resolve validation issue
```
