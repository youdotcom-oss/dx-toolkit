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

### 2. Create Package-Specific Skill (Optional)

**When to create a package-specific skill:**
- Package introduces framework-specific patterns (e.g., Teams.ai Memory API, Anthropic streaming)
- Package has domain-specific validation/transformation rules unique to its integration
- Patterns are substantial (50+ lines) and will be referenced frequently
- Examples: `mcp-patterns`, `ai-sdk-patterns`, `teams-ai-patterns`

**When NOT to create a skill:**
- Patterns are universal (belong in `.claude/rules/code-patterns.md`)
- Package has minimal integration patterns (<50 lines)
- Patterns are too package-specific and not reusable across the codebase

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
4. Add skill to root AGENTS.md skill list (lines 11-18 in Rules and Skills Organization section)

**Best practices:**
- Focus on framework/domain-specific patterns only
- Use clear ✅/❌ code examples with explanations
- Keep under 200 lines (use `.claude/rules/code-patterns.md` for universal patterns)
- Test that skill is discoverable and loadable
- Update root AGENTS.md to document the new skill

### 3. Add Performance Monitoring (Optional)

- Only required for packages that wrap You.com APIs directly
- Add measurements to `scripts/performance/measure.ts`
- See `.claude/rules/testing.md` for detailed instructions
- Skip for utility libraries, CLI tools, or packages without API wrappers

### 4. Test Locally

```bash
cd packages/{package-name}
bun test                 # Run tests
bun run check            # Check code quality
bun run build            # Build package (if bundled pattern)
```

### 5. Test Publish Workflow

- Test with prerelease before first stable release
- Go to: `https://github.com/youdotcom-oss/dx-toolkit/actions/workflows/publish-{package-name}.yml`
- Enter version `0.1.0` with next `1` to create `0.1.0-next.1`
- Verify workflow succeeds and package appears on npm

### 6. First Stable Release

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
6. **Create skills for substantial patterns** - If package introduces 50+ lines of framework-specific patterns, create a skill

## Plugin Creation Workflow

Use these steps after creating a plugin. Plugins are lightweight skills for AI agents.

### Plugin vs Package

**Plugins** (AI agent skills):
- Located in `plugins/` directory
- Distributed via git (listed in marketplace.json)
- Simple structure: skill files in `skills/` directory
- Used by Claude Code, Cursor, and other AI agents
- No build process, no separate release required

**Packages** (npm packages):
- Located in `packages/` directory
- Published to npm registry
- Have source code, tests, build process
- Used by developers in their applications

### Plugin Structure

```
plugins/{skill-name}/
├── skills/
│   └── {skill-name}.md         # Agent-skills-spec format (YAML frontmatter + Markdown)
├── README.md                    # User documentation
├── src/                         # Integration code (if any)
├── tests/                       # Tests (if any)
└── LICENSE                      # MIT license
```

That's it! No `.claude-plugin/` directory, no `commands/`, no `AGENTS.md` at plugin root.

### 1. Create Skill File

**Location:** `plugins/{skill-name}/skills/{skill-name}.md`

**Format:** Agent-skills-spec (YAML frontmatter + Markdown body)

**Example skill file structure:**
```markdown
---
name: skill-name
description: Brief description (max 1024 chars) explaining when this skill should trigger
license: MIT
compatibility:
  - claude
  - cursor
  - cody
metadata:
  version: "0.1.0"
  author: "You.com"
---

# Skill Title

Interactive workflow to achieve X.

## Prerequisites

- List required packages
- Environment variables needed
- Account requirements

## Workflow

**Step 1: Gather Information**

Ask the user:
- What framework are they using?
- What configuration do they need?

**Step 2: Install Dependencies**

```bash
npm install @youdotcom-oss/package-name
```

**Step 3: Create Configuration**

Use this template:

\```typescript
// Complete, runnable code template
\```

**Step 4: Validation**

Test the integration:
- [ ] Configuration file created
- [ ] Dependencies installed
- [ ] Environment variables set

## Troubleshooting

**Issue: Common problem**

Solution: How to fix it

## Additional Resources

- [Package README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/package-name)
- [External docs](https://example.com)
```

**Key Points:**
- Single source of truth - all workflow content in skill file
- YAML frontmatter with required fields (name, description, license, compatibility, metadata)
- Markdown body with complete workflow, templates, validation, troubleshooting
- Description field (max 1024 chars) defines when skill activates

### 2. Write README.md

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

**Use the skill:**

Claude Code automatically discovers skills from marketplace.json.

</details>

<details>
<summary><strong>Cursor</strong></summary>

\```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --cursor
\```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the skills.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

\```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --agents.md
\```

Your AI agent will automatically discover the skills via marketplace.json.

</details>
```

### 3. Add to marketplace.json

**Location:** `.claude-plugin/marketplace.json`

**Format:**
```json
{
  "plugins": [
    {
      "name": "{skill-name}",
      "source": "./{skill-name}",
      "strict": false
    }
  ]
}
```

**Key Points:**
- Add entry to `plugins` array in marketplace.json
- `name` must match skill name in YAML frontmatter
- `source` is relative path from `pluginRoot` (defined in metadata)
- `strict: false` allows skill to work across different AI agent platforms

### 4. Add to MARKETPLACE.md

**Location:** `docs/MARKETPLACE.md`

**Do NOT include version numbers** - they're not auto-updated

**Format:**
```markdown
<details open>
<summary><strong>skill-name</strong></summary>

**One-line description**

Longer description paragraph explaining what the skill does.

**What you get:**
- 🎯 Feature 1
- 🚀 Feature 2
- ✨ Feature 3

**Quick Install:**
\```bash
# Claude Code
/plugin marketplace add youdotcom-oss/dx-toolkit
/plugin install skill-name

# Or via install script:
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s skill-name --claude

# Cursor
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s skill-name --cursor

# Other AI Agents (Cody, Continue, etc.)
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s skill-name --agents.md
\```

**Documentation:**
- [Skill README](https://github.com/youdotcom-oss/dx-toolkit/tree/main/plugins/skill-name)
- [Relevant External Docs](https://example.com)

</details>
```

### 5. Test Locally

```bash
# View plugin structure
ls -R plugins/{skill-name}

# View skill file
cat plugins/{skill-name}/skills/{skill-name}.md

# Validate skill format (if validation command available)
/validate-skill plugins/{skill-name}

# Test with Claude Code (if available)
/plugin marketplace add youdotcom-oss/dx-toolkit
/plugin install {skill-name}
```

### 6. Update and Test

**No separate release workflow needed** - Skills are distributed via git:

1. **Make changes** to skill file in `plugins/{skill-name}/skills/{skill-name}.md`
2. **Update metadata version** in YAML frontmatter if needed
3. **Test locally** with validation command
4. **Commit to main branch** - Skills available immediately via `git pull`
5. **Users update** by pulling latest from repository

**Distribution strategy:**
- Skills distributed via git clone/pull
- Listed in `.claude-plugin/marketplace.json`
- No GitHub releases required (no binaries or archives)
- Changes available immediately after merge to main

### Plugin Naming Conventions

**Plugin directory:** Must match skill name in YAML frontmatter

**Examples:**
- Skill name: `teams-anthropic-integration` → Directory: `plugins/teams-anthropic-integration` ✅
- Skill name: `ai-sdk-integration` → Directory: `plugins/ai-sdk-integration` ✅

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

### Plugin Troubleshooting

**Skill not showing in Claude Code:**
- Verify skill file exists at `plugins/{skill-name}/skills/{skill-name}.md`
- Check skill has valid YAML frontmatter with required fields (name, description, license, compatibility, metadata)
- Ensure skill is listed in `.claude-plugin/marketplace.json`
- Run `git pull` to get latest marketplace changes
- Restart Claude Code after marketplace update

**Skill not triggering:**
- Check `description` field in YAML frontmatter clearly explains when to trigger
- Verify skill name in frontmatter matches directory name
- Ensure `compatibility` field includes the AI agent being used (claude, cursor, cody, etc.)

**Installation via marketplace fails:**
- Verify `.claude-plugin/marketplace.json` exists and is valid JSON
- Check `pluginRoot` is set correctly in marketplace metadata (should be `"./plugins"`)
- Ensure skill entry in plugins array has correct `name` and `source` fields
- Try installing via git clone if marketplace method fails
