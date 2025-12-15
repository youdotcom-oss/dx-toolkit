# Create Plugin Command

> **Note**: This command works with any AI coding agent. While stored in `.claude/commands/` for Claude Code slash command support, any agent can read and follow these instructions to create a new Claude Code plugin.

You are helping create a new plugin in this repository. Plugins are lightweight - just markdown command files with a manifest.

## CRITICAL RULES

1. **Ask questions ONE AT A TIME** using AskUserQuestion - wait for each answer before proceeding
2. **Validate ALL inputs** before file creation
3. **Check for conflicts** (plugin exists, directory name matches)
4. **Create files in the correct order** with proper content
5. **Provide post-creation checklist** with manual steps
6. **Implement rollback** on any failure

## Interactive Question Flow

Ask these questions sequentially (ONE AT A TIME):

### Phase 1: Basic Information

**Question 1: Plugin Name**
```
What is the plugin name? (lowercase-with-dashes, e.g., 'claude-agent-sdk-integration')

Requirements:
- Lowercase letters only
- Use hyphens (not underscores) for word separation
- Minimum 5 characters
- Must match pattern: ^[a-z][a-z0-9-]*[a-z0-9]$
- **CRITICAL**: Must match the name in `.claude-plugin/plugin.json`
  - Example: plugin name "claude-agent-sdk-integration" → Directory: plugins/claude-agent-sdk-integration/
- Examples: 'teams-anthropic-integration', 'ai-sdk-integration', 'claude-agent-sdk-integration'
```

**Validation for Question 1**:
- Check pattern: `^[a-z][a-z0-9-]*[a-z0-9]$` (requires 5+ characters, starts with letter, ends with letter/number)
- Check directory doesn't exist: `ls plugins/{plugin-name}` should fail
- No uppercase, no underscores, no special characters

**Question 2: Plugin Description**
```
One-line description for the plugin? (max 150 characters)

Example: "Integrate Claude Agent SDK with You.com HTTP MCP server"
```

**Validation for Question 2**:
- Max 150 characters
- Not empty

**Question 3: Command Name**
```
Primary slash command name? (lowercase-with-dashes, e.g., 'integrate-claude-agent')

This will be used as: /{command-name}
```

**Validation for Question 3**:
- Check pattern: `^[a-z][a-z0-9-]*[a-z0-9]$`
- Not same as plugin name (command should be verb-based)
- Examples: 'integrate-claude-agent', 'generate-teams-app', 'setup-ai-sdk'

**Question 4: Command Description**
```
Brief description of what the command does? (max 100 characters)

Example: "Set up Claude Agent SDK with You.com MCP server"
```

**Validation for Question 4**:
- Max 100 characters
- Not empty
- Action-oriented (should start with a verb)

**Question 5: Plugin Category**
```
Plugin category for marketplace?

Options:
1. workflow - Integration and setup workflows
2. enterprise-integration - Enterprise platform integrations

Choose 1 or 2:
```

**Validation for Question 5**:
- Must be either "workflow" or "enterprise-integration"

**Question 6: Keywords**
```
Keywords for marketplace? (comma-separated, e.g., 'claude, agent-sdk, mcp, integration')

Max 8 keywords.
```

**Validation for Question 6**:
- Split by comma, trim whitespace
- Max 8 keywords
- Each keyword lowercase recommended

## File Creation Steps

After gathering all information, create files in this order:

### Step 1: Create Plugin Directory Structure

```bash
mkdir -p plugins/{plugin-name}/.claude-plugin
mkdir -p plugins/{plugin-name}/commands
```

### Step 2: Create plugin.json

**File:** `plugins/{plugin-name}/.claude-plugin/plugin.json`

```json
{
  "name": "{plugin-name}",
  "version": "0.1.0",
  "description": "{description from Question 2}",
  "commands": [
    {
      "name": "{command-name from Question 3}",
      "description": "{command-description from Question 4}",
      "path": "commands/{command-name}.md"
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

### Step 3: Create Command File

**File:** `plugins/{plugin-name}/commands/{command-name}.md`

```markdown
---
name: {command-name}
description: {command-description from Question 4}
---

# {Human-Readable Command Title}

Interactive workflow to achieve the plugin's purpose.

## Workflow

1. **Ask: First Question**
   * What information do you need from the user?

2. **Validate Input**
   * Check prerequisites
   * Verify environment variables are set

3. **Create/Update Files**
   * Generate configuration
   * Show code examples

## Complete Templates

### Template Name

\```language
// TODO: Add complete, runnable code template
\```

Example template should be:
- Complete and immediately runnable
- Include all necessary imports
- Show configuration patterns
- Have clear comments
```

### Step 4: Create AGENTS.md

**File:** `plugins/{plugin-name}/AGENTS.md`

```markdown
# {Human-Readable Plugin Name}

> For AI coding agents: {description from Question 2}

## When to Use

Trigger this integration when developer mentions:
- "{keyword 1}"
- "{keyword 2}"
- "{keyword 3}"

## Integration Instructions

**Fetch and follow the complete integration workflow:**

`commands/{command-name}.md`

This file contains:
- Complete step-by-step workflow
- Configuration patterns
- Template integration guide
- Validation checklist
- Troubleshooting guide

## For Claude Code Users

Use the slash command: `/{command-name}`

## Additional Resources

* Plugin README: https://api.you.com/plugins/{plugin-name}/README.md
* {Add relevant external documentation links}
```

### Step 5: Create README.md

**File:** `plugins/{plugin-name}/README.md`

```markdown
# {Human-Readable Plugin Name}

**{One-sentence value proposition}**

{2-3 sentence description of what the plugin does and who it's for.}

---

## What This Plugin Does

This plugin helps you {describe the main workflow} through an interactive workflow that:

✅ {Feature 1}
✅ {Feature 2}
✅ {Feature 3}

---

## Installation

Get up and running in one command:

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

---

## Quick Start

After installation, run the integration command:

**Claude Code:**
\```bash
/{command-name}
\```

**Other AI Agents:**
Tell your agent: *"{natural language trigger phrase}"*

The plugin will guide you through:
1. {Step 1}
2. {Step 2}
3. {Step 3}
4. {Step 4}

---

## Prerequisites

You'll need:
- **{Prerequisite 1}** - {Where to get it}
- **{Prerequisite 2}** - {Where to get it}

---

## Troubleshooting

<details>
<summary><strong>{Common Issue 1}</strong></summary>

**Problem:** {Description of the issue}

**Solution:**
\```bash
{Commands or steps to fix}
\```

</details>

<details>
<summary><strong>{Common Issue 2}</strong></summary>

**Problem:** {Description of the issue}

**Solution:**
{Explanation and fix}

</details>

---

## Support

- **Issues**: [GitHub Issues](https://github.com/youdotcom-oss/dx-toolkit/issues)
- **Email**: support@you.com

---

**Built with ❤️ by [You.com](https://you.com)**
```

### Step 6: Copy LICENSE

**File:** `plugins/{plugin-name}/LICENSE`

```bash
cp LICENSE plugins/{plugin-name}/LICENSE
```

### Step 7: Update marketplace.json

**File:** `marketplace.json` (root)

Add new plugin entry to the `plugins` array:

```json
{
  "name": "{plugin-name}",
  "version": "0.1.0",
  "description": "{description from Question 2}",
  "category": "{category from Question 5}",
  "path": "./plugins/{plugin-name}",
  "publicUrl": "https://github.com/youdotcom-oss/dx-toolkit/releases/tag/{plugin-name}@v0.1.0",
  "downloadUrl": "https://github.com/youdotcom-oss/dx-toolkit/releases/download/{plugin-name}@v0.1.0/{plugin-name}-v0.1.0.tar.gz",
  "keywords": [{keywords from Question 6, as array}]
}
```

**CRITICAL**: Maintain proper JSON formatting with commas between array elements.

### Step 8: Create Publish Workflow

**File:** `.github/workflows/publish-{plugin-name}.yml`

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

## Post-Creation Checklist

After all files are created, present this checklist to the user:

```markdown
## ✅ Plugin Created Successfully!

Your new plugin `{plugin-name}` has been created at `plugins/{plugin-name}/`

### Next Steps:

1. **Implement command workflow** (REQUIRED before first release)
   - Edit `plugins/{plugin-name}/commands/{command-name}.md`
   - Add complete step-by-step instructions
   - Include code templates and examples
   - Test the workflow manually

2. **Enhance README.md** (REQUIRED)
   - Fill in placeholder sections
   - Add prerequisites
   - Write troubleshooting guide
   - Include real examples

3. **Add to MARKETPLACE.md** (REQUIRED)
   - Add plugin entry under appropriate category in `docs/MARKETPLACE.md`
   - See `.claude/skills/plugin-creation` for format
   - DO NOT include version numbers

4. **Test locally**
   - Verify all files are valid
   - Check plugin.json: `cat plugins/{plugin-name}/.claude-plugin/plugin.json | jq .`
   - Test with Claude Code (if available)

5. **Create first release**
   - Use prerelease version first: `0.1.0-next.1`
   - Test the release workflow
   - Then publish stable: `0.1.0`

### Files Created:
- `plugins/{plugin-name}/.claude-plugin/plugin.json`
- `plugins/{plugin-name}/commands/{command-name}.md`
- `plugins/{plugin-name}/AGENTS.md`
- `plugins/{plugin-name}/README.md`
- `plugins/{plugin-name}/LICENSE`
- `.github/workflows/publish-{plugin-name}.yml`
- Updated: `marketplace.json`

### Documentation:
- Plugin creation guide: `.claude/skills/plugin-creation/skill.md`
- Plugin marketplace docs: `docs/MARKETPLACE.md`

### Ready to implement!
Run `ls -R plugins/{plugin-name}` to verify the structure.
```

## Rollback on Failure

If any step fails:

1. Remove created directory: `rm -rf plugins/{plugin-name}`
2. Revert marketplace.json changes: `git checkout marketplace.json`
3. Remove workflow file: `rm .github/workflows/publish-{plugin-name}.yml`
4. Report error to user with specific failure reason

## Validation Checklist

Before completing:

- [ ] Plugin name matches directory name
- [ ] plugin.json is valid JSON
- [ ] Command file has proper frontmatter
- [ ] AGENTS.md references correct command file
- [ ] README.md has all installation sections
- [ ] LICENSE file exists
- [ ] marketplace.json is valid JSON
- [ ] Publish workflow file exists
- [ ] No TODO placeholders in critical files

## See Also

- Plugin creation workflow: `.claude/skills/plugin-creation/skill.md`
- Plugin marketplace documentation: `docs/MARKETPLACE.md`
- Existing plugins for reference: `plugins/*/`
