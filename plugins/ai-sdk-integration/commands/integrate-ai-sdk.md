---
name: integrate-ai-sdk
description: Integrate Vercel AI SDK applications with You.com tools
---

# Integrate AI SDK with You.com Tools

Interactive workflow to add You.com tools to your Vercel AI SDK application using `@youdotcom-oss/ai-sdk-plugin`.

## Workflow

1. **Ask: Package Manager**
   * Which package manager? (npm, bun, yarn, pnpm)
   * Install package using their choice:
     ```bash
     npm install @youdotcom-oss/ai-sdk-plugin
     # or bun add @youdotcom-oss/ai-sdk-plugin
     # or yarn add @youdotcom-oss/ai-sdk-plugin
     # or pnpm add @youdotcom-oss/ai-sdk-plugin
     ```

2. **Ask: Environment Variable Name**
   * Using standard `YDC_API_KEY`?
   * Or custom name? (if custom, get the name)
   * Have they set it in their environment?
   * If NO: Guide them to get key from https://you.com/platform/api-keys

3. **Ask: Which AI SDK Functions?**
   * Do they use `generateText()`?
   * Do they use `streamText()`?
   * Both?

4. **Ask: Existing Files or New Files?**
   * EXISTING: Ask which file(s) to edit
   * NEW: Ask where to create file(s) and what to name them

5. **For Each File, Ask:**
   * Which tools to add?
     - `youSearch` (web search)
     - `youExpress` (AI agent)
     - `youContents` (content extraction)
     - Multiple? (which combination?)
   * Using `generateText()` or `streamText()` in this file?
   * Which AI provider model? (to determine if stopWhen needed)

6. **Locate Templates**

   Get package root and template paths:
   ```bash
   node -pe "require('path').join(require('path').dirname(require.resolve('@youdotcom-oss/ai-sdk-plugin/package.json')), 'templates/generate-text.ts')"

   node -pe "require('path').join(require('path').dirname(require.resolve('@youdotcom-oss/ai-sdk-plugin/package.json')), 'templates/streaming-text.ts')"
   ```

7. **Update/Create Files**

   For each file:
   * Read template (generateText or streamText based on their answer)
   * Add import for selected tools
   * If EXISTING file: Find their generateText/streamText call and add tools object
   * If NEW file: Create file with template structure
   * Tool invocation pattern based on env var name:
     - Standard `YDC_API_KEY`: `youSearch()`
     - Custom name: `youSearch({ apiKey: process.env.CUSTOM_NAME })`
   * Add selected tools to tools object
   * If streamText + Anthropic: Add stopWhen parameter

## Tool Invocation Patterns

Based on env var name from step 2:

**Standard YDC_API_KEY:**
```typescript
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

tools: {
  search: youSearch(),
}
```

**Custom env var:**
```typescript
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';

const apiKey = process.env.THEIR_CUSTOM_NAME;

tools: {
  search: youSearch({ apiKey }),
}
```

**Multiple tools with standard env var:**
```typescript
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

tools: {
  search: youSearch(),
  agent: youExpress(),
  extract: youContents(),
}
```

**Multiple tools with custom env var:**
```typescript
import { youSearch, youExpress, youContents } from '@youdotcom-oss/ai-sdk-plugin';

const apiKey = process.env.THEIR_CUSTOM_NAME;

tools: {
  search: youSearch({ apiKey }),
  agent: youExpress({ apiKey }),
  extract: youContents({ apiKey }),
}
```

## Available Tools

### youSearch
Web and news search - model determines parameters (query, count, country, etc.)

### youExpress
AI agent with web context - model determines parameters (input, tools)

### youContents
Web page content extraction - model determines parameters (urls, format)

## Key Template Patterns

Templates show:
* Import statements (AI SDK + provider + You.com tools)
* Env var validation (optional for new files)
* Tool configuration based on env var
* generateText/streamText usage with tools
* Result handling (especially textStream destructuring for streamText)
* Anthropic streaming pattern (stopWhen: stepCountIs(3))

## Implementation Checklist

For each file being updated/created:

- [ ] Import added for selected tools
- [ ] If custom env var: Variable declared with correct name
- [ ] tools object added to generateText/streamText
- [ ] Each selected tool invoked correctly:
  - Standard env: `toolName()`
  - Custom env: `toolName({ apiKey })`
- [ ] If streamText: Destructured `const { textStream } = ...`
- [ ] If Anthropic + streamText: Added `stopWhen: stepCountIs(3)`

Global checklist:

- [ ] Package installed with their package manager
- [ ] Env var set in their environment
- [ ] All files updated/created
- [ ] Ready to test

## Common Issues

**Issue**: "Cannot find module @youdotcom-oss/ai-sdk-plugin"
**Fix**: Install with their package manager

**Issue**: "YDC_API_KEY (or custom name) environment variable is required"
**Fix**: Set in their environment (get key: https://you.com/platform/api-keys)

**Issue**: "Tool execution fails with 401"
**Fix**: Verify API key is valid

**Issue**: "streamText loops infinitely"
**Fix**: If Anthropic, add `stopWhen: stepCountIs(3)`

**Issue**: "textStream is not iterable"
**Fix**: Destructure: `const { textStream } = streamText(...)`

**Issue**: "Custom env var not working"
**Fix**: Pass to each tool: `youSearch({ apiKey })`

## Additional Resources

* Package README: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/ai-sdk-plugin
* Vercel AI SDK Docs: https://sdk.vercel.ai/docs
* You.com API: https://you.com/platform/api-keys
