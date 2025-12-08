# Examples

This directory contains usage examples for `@youdotcom-oss/ai-sdk-plugin`.

## Prerequisites

1. Install dependencies:
   \`\`\`bash
   bun install
   \`\`\`

2. Set your You.com API key:
   \`\`\`bash
   export YDC_API_KEY=your-key-here
   \`\`\`

3. Start the MCP server:
   \`\`\`bash
   bun --cwd packages/mcp start
   \`\`\`

## Running Examples

\`\`\`bash
# Basic web search
bun examples/basic-search.ts

# Streaming responses
bun examples/streaming-text.ts

# AI agent with web search
bun examples/agent-response.ts

# Content extraction
bun examples/content-extraction.ts

# Error handling
bun examples/error-handling.ts
\`\`\`

## Examples Overview

### basic-search.ts
Simple web search example using `generateText()` with `you-search` tool.

### streaming-text.ts
Demonstrates streaming responses with `streamText()` for real-time output.

### agent-response.ts
Uses `you-express` tool for fast AI agent responses with optional web search.

### content-extraction.ts
Shows how to extract and process web page content using `you-contents` tool.

### error-handling.ts
Comprehensive error handling example with helpful error messages and solutions.

## Tips

- Set `maxSteps` higher (5-10) for complex multi-tool tasks
- Use `you-search` for comprehensive web search
- Use `you-express` for quick AI answers with web context
- Use `you-contents` to extract full page content
- Always call `close()` to clean up MCP client connection

## Troubleshooting

**Error: API key required**
- Set `YDC_API_KEY` environment variable

**Error: Failed to create MCP client**
- Ensure MCP server is running on `http://localhost:4000/mcp`
- Check server health: `curl http://localhost:4000/mcp-health`

**Error: Failed to fetch tools**
- Verify API key is valid
- Check MCP server logs for errors
