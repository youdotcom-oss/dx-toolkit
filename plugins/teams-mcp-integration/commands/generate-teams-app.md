---
name: generate-teams-app
description: Integrate Microsoft Teams app with You.com MCP server
---

# Generate Teams App with You.com MCP

Set up Microsoft Teams application with You.com MCP server integration using the `@youdotcom-oss/teams-anthropic` package.

## Workflow

1. **Install Package**
   ```bash
   npm install @youdotcom-oss/teams-anthropic @microsoft/teams.ai @microsoft/teams.mcpclient
   ```

2. **Ask Integration Type**
   * New Teams app (use entire template)
   * Existing app (follow inline markers)

3. **Copy Template**
   * Copy from: `node_modules/@youdotcom-oss/teams-anthropic/templates/mcp-client.ts`
   * New app: Use entire file
   * Existing: Follow EXISTING APP markers in template

4. **Environment Setup**
   * Create .env with YDC_API_KEY and ANTHROPIC_API_KEY
   * Guide developer to get API keys

## Template Sections

The template has clear inline markers:

* `// ← EXISTING APP: SKIP THIS LINE` - Skip for existing apps
* `// ← EXISTING APP: START HERE` - Start copying here
* `// ← EXISTING APP: SKIP THIS ENTIRE SECTION` - Skip section

**For NEW apps**: Use entire template (lines 1-93)

**For EXISTING apps**:

* Skip line 20 (App import)
* Copy lines 21-25 (other imports)
* Copy lines 31-45 (environment validation)
* Copy lines 52-74 (ChatPrompt setup)
* Skip lines 82-93 (app setup)

## Key Integration Points

**Template markers:**
* `// ← EXISTING APP: SKIP THIS LINE` - Skip for existing apps
* `// ← EXISTING APP: START HERE` - Start copying here
* `// ← EXISTING APP: SKIP THIS ENTIRE SECTION` - Skip entire section

**ChatPrompt Configuration (always needed):**
* AnthropicChatModel with Claude Sonnet 4.5
* McpClientPlugin for MCP support
* `getYouMcpConfig()` utility - automatically configures:
  * URL: `https://api.you.com/mcp`
  * Bearer authentication with YDC_API_KEY
  * User-Agent with package version

**For Existing Apps:**
* Add to your existing app structure
* Ensure logger is configured
* Add environment validation
* Integrate ChatPrompt where needed

## Validation Checklist

Before completing:

- [ ] Package installed: `@youdotcom-oss/teams-anthropic`
- [ ] Dependencies installed: `@microsoft/teams.ai` `@microsoft/teams.mcpclient`
- [ ] Template copied appropriately (new app vs existing app)
- [ ] Environment variables set in .env
- [ ] Imports match integration type (skip App import for existing apps)
- [ ] ChatPrompt properly configured
- [ ] `getYouMcpConfig()` used (automatically handles URL and auth)

## Common Issues

**Issue**: "Cannot find module @youdotcom-oss/teams-anthropic"
**Fix**: Run `npm install @youdotcom-oss/teams-anthropic`

**Issue**: "YDC_API_KEY environment variable is required"
**Fix**: Add to .env file: `YDC_API_KEY=your-key-here`

**Issue**: "ANTHROPIC_API_KEY environment variable is required"
**Fix**: Add to .env file: `ANTHROPIC_API_KEY=your-key-here`

**Issue**: "MCP connection fails"
**Fix**: Verify API key is valid at https://you.com/platform/api-keys

**Issue**: "Import error for App from @microsoft/teams.apps"
**Fix**: For existing apps, skip this import (line 20 in template)

## Additional Resources

* Package README: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/teams-anthropic
* Plugin README: https://api.you.com/plugins/teams-mcp-integration/README.md
* You.com MCP Server: https://documentation.you.com/developer-resources/mcp-server
