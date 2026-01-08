# Package and Plugin Creation Workflows

Post-creation workflows for new packages and plugins in dx-toolkit monorepo.

## Package Creation Workflow

Use these steps after creating a package with the create-package command.

### 1. Implement Package Logic

- Edit `packages/{package-name}/src/main.ts` to export your public API
- Add TSDoc comments to all exports for API documentation
- Create feature modules in `src/` directory
- Add tests in `src/tests/` directory
- Run `bun run check` from package directory to verify code quality

### 2. Register Package Documentation

- Add your package's AGENTS.md reference to root `CLAUDE.md`
- This ensures Claude Code can access package development guidelines
- Format: `@packages/{package-name}/AGENTS.md`

### 3. Create Package-Specific Skill (Optional)

**When to create a package-specific skill:**
- Package introduces framework-specific patterns (e.g., Teams.ai Memory API, Anthropic streaming)
- Package has domain-specific validation/transformation rules unique to its integration
- Patterns are substantial (50+ lines) and will be referenced frequently
- Examples: `mcp-patterns`, `ai-sdk-patterns`, `teams-ai-patterns`

**When NOT to create a skill:**
- Patterns are universal (belong in `.claude/rules/code-patterns.md`)
- Package has minimal integration patterns (<50 lines)
- Patterns fit better in package AGENTS.md (very package-specific, not reusable)

**Skill directory structure:**
```
.claude/skills/{package-name}-patterns/
└── SKILL.md
```

**How to create:**

1. Create skill directory and SKILL.md with frontmatter:
```markdown
---
name: {package-name}-patterns
description: {Package} patterns for dx-toolkit - [key patterns summary]
---

# {Package} Patterns

Package-specific patterns for `@youdotcom-oss/{package-name}`. Use these patterns when developing with this package.

## Pattern Section 1

[Pattern description with ✅/❌ examples]

**Why this pattern?**
[Explanation]

## Pattern Section 2

[Continue with other patterns]
```

2. Add pattern sections with clear ✅/❌ code examples
3. Explain "Why this pattern?" for each
4. Reference skill from package AGENTS.md: `> **For {package} patterns**, see '.claude/skills/{package-name}-patterns'`
5. Add skill to root AGENTS.md skill list (lines 11-18 in Skill-Based Organization section)

**Best practices:**
- Focus on framework/domain-specific patterns only
- Use clear ✅/❌ code examples with explanations
- Keep under 200 lines (use `.claude/rules/code-patterns.md` for universal patterns)
- Test that skill is discoverable and loadable
- Update root AGENTS.md to document the new skill

### 4. Add Performance Monitoring (Optional)

- Only required for packages that wrap You.com APIs directly
- Add measurements to `scripts/performance/measure.ts`
- See `.claude/rules/testing.md` for detailed instructions
- Skip for utility libraries, CLI tools, or packages without API wrappers

### 5. Test Locally

```bash
cd packages/{package-name}
bun test                 # Run tests
bun run check            # Check code quality
bun run build            # Build package (if bundled pattern)
```

### 6. Test Publish Workflow

- Test with prerelease before first stable release
- Go to: `https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml`
- Enter version `0.1.0` with next `1` to create `0.1.0-next.1`
- Verify workflow succeeds and package appears on npm

### 7. First Stable Release

- Push package code to main branch
- Trigger publish workflow with version `0.1.0` (no next value)
- Verify package at `https://www.npmjs.com/package/{npm-package-name}`
- Test installation: `bun add {npm-package-name}`

### Package Creation Best Practices

1. **Test locally first** - Ensure package works before publishing
2. **Use prerelease** - Test publish workflow with next version first
3. **Document with TSDoc** - Add API docs directly in code, not separate API.md
4. **Follow patterns** - Use appropriate rules and skills for implementation
5. **Check quality** - Run `bun run check` before committing
6. **Register docs** - Add AGENTS.md to root CLAUDE.md
7. **Create skills for substantial patterns** - If package introduces 50+ lines of framework-specific patterns, create a skill

## Plugin Creation Workflow

Use these steps after creating a plugin. Plugins are lightweight - just commands in markdown files.

### Plugin vs Package

**Plugins** (Claude Code plugins):
- Located in `plugins/` directory
- Distributed via GitHub releases (not npm)
- Simple structure: just markdown commands + manifest
- Used by Claude Code, Cursor, and other AI agents
- No build process, no dependencies

**Packages** (npm packages):
- Located in `packages/` directory
- Published to npm registry
- Have source code, tests, build process
- Used by developers in their applications

### Plugin Structure

```
plugins/{plugin-name}/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (required)
├── AGENTS.md                    # Universal AI agent instructions
├── commands/
│   └── {command}.md            # Command implementation files
├── README.md                    # User-facing documentation
└── LICENSE                      # MIT license
```

That's it! No package.json, no tsconfig.json, no src directory.

### 1. Implement Command Files

**Commands directory pattern:**
- Create `commands/{command-name}.md` for each slash command
- Use frontmatter with name and description
- Write complete workflow with step-by-step instructions
- Include code examples and configuration blocks

**Example command file structure:**
```markdown
---
name: command-name
description: Brief description of what this command does
---

# Command Title

Interactive workflow to achieve X.

## Workflow

1. **Ask: First Question**
   * What information do you need?

2. **Validate Input**
   * Check prerequisites
   * Verify environment variables

3. **Create/Update Files**
   * Use complete templates
   * Show configuration examples

## Complete Templates

### Template Name

\```language
// Complete, runnable code
\```
```

### 2. Write AGENTS.md

**Purpose:** Lightweight alias file for non-Claude Code AI agents

**Pattern:**
```markdown
# Plugin Name

> For AI coding agents: Brief description

## When to Use

Trigger this integration when developer mentions:
- "keyword phrase 1"
- "keyword phrase 2"

## Integration Instructions

**Fetch and follow the complete integration workflow:**

`commands/{command-name}.md`

This file contains:
- Complete step-by-step workflow
- Language/framework selection
- Configuration patterns
- Template integration guide
- Validation checklist

## For Claude Code Users

Use the slash command: `/{command-name}`

## Additional Resources

* Plugin README: https://api.you.com/plugins/{plugin-name}/README.md
* Relevant external docs
```

**Key Principle:** Never duplicate content. AGENTS.md just points to command files.

### 3. Write README.md

**Tone:** Encouraging and accessible

**Required sections:**
1. **What you get** - Bullet points with emojis
2. **Installation** - Collapsible sections for each platform
3. **Quick Start** - 4 steps maximum
4. **Prerequisites** - What users need
5. **Troubleshooting** - Common issues with solutions

**Installation format:**
```markdown
<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

\```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --claude
\```

**Option 2: Via marketplace**

First add the marketplace:
\```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
\```

Then install the plugin:
\```bash
/plugin install {plugin-name}
\```

**Use the plugin:**
\```bash
/{command-name}
\```

</details>

<details>
<summary><strong>Cursor</strong></summary>

\```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --cursor
\```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the plugin.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

\```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --agents.md
\```

Your AI agent will automatically discover the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>
```

### 4. Create plugin.json

**Required fields per Claude Code specification:**
```json
{
  "name": "plugin-name",
  "version": "0.1.0",
  "description": "Brief description",
  "commands": [
    {
      "name": "command-name",
      "description": "What this command does",
      "path": "commands/command-name.md"
    }
  ],
  "author": {
    "name": "You.com",
    "email": "support@you.com",
    "url": "https://you.com"
  },
  "license": "MIT",
  "repository": "https://github.com/youdotcom-oss/dx-toolkit"
}
```

**Key points:**
- Use object format for author (not string)
- Version starts at 0.1.0 for initial release
- Commands array references markdown files in commands/
- No dependencies, no devDependencies

### 5. Add to marketplace.json

**Location:** Root `marketplace.json`

**Format:**
```json
{
  "name": "plugin-name",
  "version": "0.1.0",
  "description": "Brief description matching plugin.json",
  "category": "workflow",
  "path": "./plugins/plugin-name",
  "publicUrl": "https://github.com/youdotcom-oss/dx-toolkit/releases/tag/plugin-name@v0.1.0",
  "downloadUrl": "https://github.com/youdotcom-oss/dx-toolkit/releases/download/plugin-name@v0.1.0/plugin-name-v0.1.0.tar.gz",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
```

**Categories:**
- `workflow` - Integration and setup workflows
- `enterprise-integration` - Enterprise platform integrations

### 6. Add to MARKETPLACE.md

**Location:** `docs/MARKETPLACE.md`

**Do NOT include version numbers** - they're not auto-updated

**Format:**
```markdown
<details open>
<summary><strong>plugin-name</strong></summary>

**One-line description**

Longer description paragraph explaining what the plugin does.

**What you get:**
- 🎯 Feature 1
- 🚀 Feature 2
- ✨ Feature 3

**Quick Install:**
\```bash
# Claude Code
/plugin install plugin-name
# Or: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s plugin-name --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s plugin-name --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s plugin-name --agents.md
\```

**Documentation:**
- [Plugin README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/plugin-name)
- [Relevant External Docs](https://example.com)
- [GitHub Releases](https://github.com/youdotcom-oss/dx-toolkit/releases?q=plugin-name)

</details>
```

### 7. Create Publish Workflow

**Location:** `.github/workflows/publish-{plugin-name}.yml`

**Template:**
```yaml
name: "Plugin: publish {plugin-name}"

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Version to publish (e.g., 1.0.0)"
        required: true
        type: string
      next:
        description: "Next prerelease number (optional, e.g., 1 for v1.0.0-next.1)"
        required: false
        type: string

jobs:
  publish:
    name: Publish Plugin
    uses: ./.github/workflows/_publish-plugin.yml
    with:
      plugin_name: {plugin-name}
      version: ${{ inputs.version }}
      next: ${{ inputs.next }}
    secrets:
      PUBLISH_TOKEN: ${{ secrets.PUBLISH_TOKEN }}
```

### 8. Test Locally

```bash
# View plugin structure
ls -R plugins/{plugin-name}

# Test commands are accessible
cat plugins/{plugin-name}/commands/{command-name}.md

# Verify plugin.json is valid
cat plugins/{plugin-name}/.claude-plugin/plugin.json | jq .

# Test with Claude Code (if available)
/plugin install {plugin-name}
/{command-name}
```

### 9. First Release

**Use prerelease for testing:**
```bash
# Trigger workflow with prerelease version
Actions → Publish {plugin-name} Release → Run workflow
Version: 0.1.0
Next: 1
```

This creates `plugin-name@v0.1.0-next.1` for testing.

**First stable release:**
```bash
Version: 0.1.0
Next: (leave empty)
```

This creates `plugin-name@v0.1.0` as the first stable release.

### Plugin Naming Conventions

**Plugin directory:** Must match plugin name in `.claude-plugin/plugin.json`

**Examples:**
- Plugin name: `teams-anthropic-integration` → Directory: `plugins/teams-anthropic-integration` ✅
- Plugin name: `claude-agent-sdk-integration` → Directory: `plugins/claude-agent-sdk-integration` ✅

**Version format:**
- Git tags: `v{version}` (e.g., `v1.0.0`)
- plugin.json and marketplace.json: `{version}` (no "v" prefix)

### MCP Server Naming Convention

**For plugins that configure MCP servers:**

Use `ydc` as the server name/label for consistency with tool naming:

**Claude Agent SDK:**
```python
mcp_servers={
    "ydc": {
        "type": "http",
        "url": "https://api.you.com/mcp",
        "headers": {"Authorization": f"Bearer {os.getenv('YDC_API_KEY')}"}
    }
}

allowed_tools=[
    "mcp__ydc__you_search",
    "mcp__ydc__you_express",
    "mcp__ydc__you_contents"
]
```

**OpenAI Agents SDK:**
```python
HostedMCPTool(
    tool_config={
        "type": "mcp",
        "server_label": "ydc",
        "server_url": "https://api.you.com/mcp",
        "headers": {"Authorization": f"Bearer {os.environ['YDC_API_KEY']}"},
        "require_approval": "never"
    }
)
```

**Rationale:** Tools are named `you_search`, `you_express`, etc. Using `ydc` (You.com abbreviation) as the server identifier provides clear distinction while maintaining consistency.

### Plugin Distribution

Plugins are distributed via GitHub Releases, not npm:

**Release URL format:**
- Tag: `{plugin-name}@v{version}`
- Archive: `{plugin-name}-v{version}.tar.gz`
- Download: `https://github.com/youdotcom-oss/dx-toolkit/releases/download/{plugin-name}@v{version}/{plugin-name}-v{version}.tar.gz`

**Marketplace versioning:**
- Format: Date-based CalVer (`YYYY.MM.DD`)
- Auto-bumped on every plugin release
- Indicates last marketplace update date

### Plugin Troubleshooting

**Plugin not showing in Claude Code:**
- Verify `.claude-plugin/plugin.json` exists and is valid JSON
- Check plugin name matches directory name
- Ensure plugin is in marketplace.json
- Restart Claude Code after installation

**Command not found:**
- Verify command is listed in `plugin.json` commands array
- Check command file path matches what's in plugin.json
- Ensure command file has proper frontmatter

**Installation fails:**
- Check plugin archive is accessible at GitHub release URL
- Verify marketplace.json has correct downloadUrl
- Ensure version in marketplace.json matches the release tag
