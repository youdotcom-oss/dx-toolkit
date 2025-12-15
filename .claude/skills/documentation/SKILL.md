---
name: documentation
description: Documentation standards for README.md and AGENTS.md files - tone, structure, thin AGENTS.md philosophy
---

# Documentation Standards

Complete documentation standards for dx-toolkit packages. Use these guidelines when creating or updating README.md and AGENTS.md files.

---

## Root README.md - Monorepo Overview

**IMPORTANT**: The root `README.md` (at monorepo level) is an exception to package-specific guidelines.

**Purpose**: Project overview for multiple audiences (users + contributors)

**Structure**:
1. **Overview and Packages** (user-facing) - What's available
2. **Quick Start for Users** - Choose a package → Follow its README
3. **Quick Start for Contributors** - Essential setup only (5 commands max)
4. **Essential Commands** - Basic operations, link to AGENTS.md for details
5. **Documentation Links** - Clear separation: user docs vs contributor docs
6. **Roadmap** - In development + future plans (link to docs/ROADMAP.md)
7. **Advanced Topics** - Use `<details>` for contributor-heavy content

**Key Principles**:
- ✅ Progressive disclosure - Use `<details>` for advanced topics
- ✅ Clear audience separation - Label "For Users" vs "For Contributors"
- ✅ Link to detailed docs - Don't duplicate AGENTS.md or package READMEs
- ✅ Keep essential commands visible - Detailed commands in AGENTS.md
- ✅ Reflect current state - Update roadmap section for upcoming work
- ❌ Don't duplicate workflow details - Link to AGENTS.md#monorepo-architecture
- ❌ Don't show full directory structure - Link to AGENTS.md#monorepo-structure
- ❌ Don't list "coming soon" in main package list - Use roadmap section

**Target Length**: 300-400 lines (not 500+) with collapsed sections

These guidelines apply to **package-level documentation** (e.g., `packages/mcp/README.md`, `packages/ai-sdk-plugin/README.md`).

## Thin AGENTS.md Philosophy

Package AGENTS.md files should be **minimal wrappers** that primarily reference skills.

### What to Include (Package-Specific Only)

✅ **Include these in package AGENTS.md**:
- Quick setup commands (2-3 lines)
- Framework-specific patterns (e.g., "Teams.ai Memory API uses `push()` not `addMessage()`")
- Domain-specific integration rules (e.g., "Anthropic requires system messages as separate parameter")
- Package-specific error patterns (e.g., "MCP tools must return responses, never throw")
- Architecture diagram if complex
- Troubleshooting specific to this package

### What to Reference (Universal Patterns)

❌ **Reference skills instead of duplicating**:
- Arrow functions, Bun APIs → `.claude/skills/code-patterns`
- Test patterns, retry config → `.claude/skills/code-patterns`
- Error handling (`err: unknown`) → `.claude/skills/code-patterns`
- Type guards, private fields → `.claude/skills/code-patterns`
- Git workflow, commits → `.claude/skills/git-workflow`
- Documentation standards → `.claude/skills/documentation`

### Good vs Bad Examples

**❌ BAD - Bloated AGENTS.md** (500+ lines):
```markdown
## Code Style

### Arrow Functions
Always use arrow functions...
[50 lines of examples]

### Numeric Separators
Use underscores for large numbers...
[30 lines of examples]

### Error Handling
Always use try/catch with typed errors...
[100 lines of examples]

### Testing
Use test() not it()...
[150 lines of examples]

## Package-Specific Patterns
[Buried at the bottom, only 20 lines]
```

**✅ GOOD - Thin AGENTS.md** (150 lines):
```markdown
## Code Style

> **For universal patterns**: See `.claude/skills/code-patterns`

## Package-Specific Patterns

### Teams.ai Memory API

Use `push()` and `values()`, NEVER `addMessage()`:
```ts
// ✅ Correct
await memory.push(input);
const messages = await memory.values();
```

[Only package-specific patterns, ~100 lines total]

## Related Skills
- `.claude/skills/teams-ai-patterns` - Teams.ai integration
- `.claude/skills/code-patterns` - Universal patterns
```

## Document Types

### Package README.md - User-Facing Documentation

**Audience**: End users (developers integrating the package)

**Tone**: Encouraging and accessible

**Content Requirements**:
- Maximum 4 steps in "Getting started" section
- Natural language examples in quotes
- Progressive disclosure with collapsible sections
- Second-person voice ("you", "your")
- Emphasize immediate value

**Language Patterns**:
| ✅ Do | ❌ Don't |
|-------|----------|
| "Get up and running in 3 quick steps" | "Installation procedure requires..." |
| "No installation required" | "This package is hosted remotely" |
| "Your agent will automatically..." | "The system executes..." |
| "Just describe what you want" | "Invoke the tool with parameters" |

### Package AGENTS.md - Thin Developer Documentation

**Audience**: Developers, contributors, AI coding agents

**Tone**: Directive and technical (for package-specific content)

**Content Requirements** (Thin approach):
- Clear audience disclaimer at top
- Quick setup (2-3 commands)
- Reference to universal skills immediately
- **ONLY package-specific patterns** (framework APIs, domain rules)
- Architecture diagram if needed
- Symptom/solution troubleshooting for package-specific issues
- Heavy skill references throughout

**Structure**:
```markdown
# Package Development Guide

> For end users: See [README.md]
> For universal patterns: `.claude/skills/code-patterns`

## Quick Start
[2-3 commands only]

## Code Style
> See `.claude/skills/code-patterns`

## Package-Specific Patterns
[Only patterns unique to this package's domain]

## Testing
> For universal patterns: `.claude/skills/code-patterns`

### Package-Specific Testing
[Only if truly unique to this package]

## Related Skills
[List of relevant skills]
```

**Target Length**: 100-200 lines (not 500+)

### Plugin README.md - Multi-Platform Installation Guide

**Audience**: End users (developers installing and using the plugin)

**Tone**: Encouraging and accessible (same as package README)

**Key Differences from Package README**:
1. **Multi-platform installation** - Claude Code, Cursor, and universal agents
2. **Progressive disclosure per platform** - Use `<details>` tags for each platform
3. **Multiple installation options** - Install script (recommended) + manual marketplace
4. **Critical command order** - Marketplace add BEFORE plugin install
5. **Multiple package managers** - npm, bun, yarn, pnpm in troubleshooting
6. **Provider-agnostic issues** - Avoid framework-specific problem titles

**Installation Section Pattern**:
```markdown
## Installation

Get up and running in one command:

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**

The script automatically configures the marketplace and installs the plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --claude
```

**Option 2: Via marketplace**

First add the marketplace:
```bash
/plugin marketplace add youdotcom-oss/dx-toolkit
```

Then install the plugin:
```bash
/plugin install {plugin-name}
```

**Use the plugin:**
```bash
/{command-name}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --cursor
```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the plugin.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --agents.md
```

Your AI agent will automatically discover the plugin via `AGENTS.md`.

Learn more: [agents.md specification](https://agents.md/)

</details>
```

**Troubleshooting Section Pattern** (Multiple Package Managers):
```markdown
<details>
<summary><strong>Cannot find module @youdotcom-oss/{package-name}</strong></summary>

The plugin should have installed it automatically. If not, run:

```bash
# NPM
npm install @youdotcom-oss/{package-name}

# Bun
bun add @youdotcom-oss/{package-name}

# Yarn
yarn add @youdotcom-oss/{package-name}

# pnpm
pnpm add @youdotcom-oss/{package-name}
```

</details>
```

**Provider-Agnostic Issue Titles**:
| ✅ Do | ❌ Don't |
|-------|----------|
| "Incomplete or missing response" | "streamText loops infinitely (Anthropic)" |
| "API key not recognized" | "401 error with Claude" |
| "Function not executed" | "Tool use fails in GPT-4" |

### Plugin AGENTS.md - Command Discovery Wrapper

**Audience**: Universal AI agents (Claude, Cursor, Windsurf, Cody, Continue, etc.)

**Purpose**: Lightweight file that helps AI agents discover and reference plugin commands

**Key Differences from Package AGENTS.md**:
1. **Different purpose** - Not for contributors, for AI agent discovery
2. **Thin wrapper pattern** - Points to command files, never duplicates content
3. **Relative paths** - Uses install-location-relative paths, not repository paths
4. **Public distribution** - Hosted at `https://api.you.com/plugins/{plugin-name}/AGENTS.md`
5. **Cross-IDE compatibility** - Works with agents that don't support Claude Code plugins
6. **Single source of truth** - Detailed instructions stay in `commands/` directory

**Structure**:
```markdown
# {Plugin Title}

> For AI coding agents: {One-sentence description}

## When to Use

Trigger this integration when developer mentions:
- "{Keyword phrase 1}"
- "{Keyword phrase 2}"
- "{Keyword phrase 3}"

## Integration Instructions

**Fetch and follow the complete integration workflow:**

`commands/{command-name}.md`

This file contains:
- Complete step-by-step workflow
- Template integration patterns
- Configuration guide
- Validation checklist
- Troubleshooting guide

## For Claude Code Users

Use the slash command: `/{command-name}`

## Additional Resources

* Package README: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/{package-name}
* Plugin README: https://api.you.com/plugins/{plugin-name}/README.md
```

**Critical Rules**:
- ✅ **Use relative paths** - `commands/{command-name}.md` (from installed location)
- ❌ **Never use repository paths** - Not `plugins/{plugin-name}/commands/{command-name}.md`
- ✅ **Reference command files** - Never duplicate command content
- ❌ **Never include full workflow** - Keep as thin wrapper
- ✅ **List trigger keywords** - Help AI agents know when to use
- ❌ **No contribution guidelines** - This is not for developers

**Target Length**: 30-50 lines (extremely thin wrapper)

**Why this pattern**:
- ✅ Single source of truth - Detailed instructions in commands/
- ✅ Never out of sync - AGENTS.md just points to command file
- ✅ Cross-agent compatibility - Works with Cursor, Windsurf, Cody, etc.
- ✅ Simple maintenance - Update command once, AGENTS.md unchanged

## API Documentation Strategy

**Do NOT create API.md files**. Instead:

### Add TSDoc to all exports

```typescript
/**
 * Search the web using You.com API
 *
 * @param config - Optional configuration with API key
 * @returns AI SDK tool for web search
 *
 * @example
 * ```ts
 * import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
 *
 * const search = youSearch();
 * await generateText({
 *   model: 'anthropic/claude-sonnet-4.5',
 *   tools: { search },
 *   prompt: 'What happened today?'
 * });
 * ```
 */
export const youSearch = (config: YouToolsConfig = {}) => { ... }
```

### Benefits of TSDoc over API.md

✅ **Single source of truth** - Types + docs in code
✅ **Always in sync** - Can't drift from implementation
✅ **IDE integration** - Hover shows docs instantly
✅ **AI reads directly** - Agents can access from source
✅ **Less maintenance** - One less file to update

## Thin AGENTS.md Template

```markdown
# {Package Name} Development Guide

Developer documentation for {package description}.

> **For end users**: See [README.md](./README.md) for setup and usage.
> **For universal patterns**: See `.claude/skills/code-patterns`

---

## Quick Start

\`\`\`bash
cd packages/{package-name}
bun install
bun test
\`\`\`

## Code Style

> **For universal patterns**: See `.claude/skills/code-patterns`

## Package-Specific Patterns

### [Framework/Domain Pattern 1]

[Only include if unique to this package's domain]

\`\`\`ts
// ✅ Correct - package-specific best practice
[example]

// ❌ Wrong - problematic pattern for this package
[anti-pattern]
\`\`\`

**Why this pattern?**
[Explanation specific to this package's domain]

### [Framework/Domain Pattern 2]

[Continue with only package-specific patterns]

## Testing

> **For universal patterns**: See `.claude/skills/code-patterns`

### Package-Specific Testing Patterns

[Only if testing approach is unique to this package]

## Architecture

[Diagram or description if package has complex architecture]

## Troubleshooting

### Symptom: [Package-specific problem]

**Solution**:
\`\`\`bash
[Fix specific to this package]
\`\`\`

## Related Skills

- `.claude/skills/{package-specific-skill}` - [Package-specific patterns]
- `.claude/skills/code-patterns` - Universal code patterns
- `.claude/skills/documentation` - Documentation standards
- `.claude/skills/git-workflow` - Git conventions

## Contributing

See root AGENTS.md for contribution guidelines.

**Package scope**: Use \`{package-name}\` in commit messages:
\`\`\`bash
feat({package-name}): add feature
fix({package-name}): resolve issue
\`\`\`
```

**Target**: 100-200 lines total, not 500+

## Validation Checklists

### Package README.md Checklist:
- [ ] Has 4-step "Getting started" section
- [ ] Uses encouraging language ("quick", "easy", "just")
- [ ] Provides natural language examples
- [ ] Uses second-person voice throughout
- [ ] Emphasizes immediate value
- [ ] Avoids technical jargon in main flow

### Package AGENTS.md Checklist (Thin Approach):
- [ ] Starts with clear audience disclaimer
- [ ] References `.claude/skills/code-patterns` upfront
- [ ] Quick setup is 2-3 commands only
- [ ] Contains ONLY package-specific patterns
- [ ] No universal patterns duplicated (arrow functions, test patterns, etc.)
- [ ] Heavy skill references throughout
- [ ] Target length: 100-200 lines (not 500+)
- [ ] Lists related skills at bottom

### Plugin README.md Checklist:
- [ ] Has installation section with three platform variants (Claude Code, Cursor, Other AI Agents)
- [ ] Each platform in `<details>` tag for progressive disclosure
- [ ] Claude Code section has TWO options (install script recommended, marketplace manual)
- [ ] Marketplace commands in correct order (add marketplace FIRST, then install)
- [ ] Troubleshooting sections include ALL package managers (npm, bun, yarn, pnpm)
- [ ] Issue titles are provider-agnostic (no "Anthropic", "OpenAI", etc.)
- [ ] Uses encouraging language and second-person voice (same as package README)
- [ ] Links to package README and plugin command documentation

### Plugin AGENTS.md Checklist:
- [ ] Extremely thin wrapper (30-50 lines)
- [ ] Has "When to Use" section with trigger keywords
- [ ] References command file with relative path (`commands/{command-name}.md`)
- [ ] NEVER uses repository-relative paths (`plugins/{plugin-name}/...`)
- [ ] Does NOT duplicate command content (single source of truth)
- [ ] Lists what command file contains (workflow, templates, validation, troubleshooting)
- [ ] Includes slash command for Claude Code users
- [ ] Links to package README and plugin README as additional resources
- [ ] NO contribution guidelines (not for developers)
- [ ] NO package-specific patterns (those go in package AGENTS.md)

### TSDoc API Documentation:
- [ ] All exports have TSDoc comments
- [ ] TSDoc includes description, params, returns
- [ ] TSDoc includes @example with runnable code
- [ ] No separate API.md file exists

## Common Mistakes

### ❌ Bloated AGENTS.md
```markdown
# AGENTS.md (600 lines)

## Arrow Functions
[100 lines of universal patterns]

## Error Handling
[150 lines of universal patterns]

## Testing
[200 lines of universal patterns]

## Package-Specific Patterns
[Only 50 lines buried at bottom]
```

**Problem**: Duplicates universal patterns, hard to maintain, hard to find package-specific content

### ✅ Thin AGENTS.md
```markdown
# AGENTS.md (150 lines)

> For universal patterns: `.claude/skills/code-patterns`

## Package-Specific Patterns

### Teams.ai Memory API
[50 lines of package-specific patterns]

### Anthropic Streaming
[50 lines of package-specific patterns]

## Related Skills
- `.claude/skills/teams-ai-patterns`
- `.claude/skills/code-patterns`
```

**Benefits**: Easy to maintain, clear separation, package-specific content easy to find

## Migration Path

### For Existing Packages

1. **Audit current AGENTS.md** - Identify universal vs package-specific patterns
2. **Extract universal patterns** - Already covered by skills, can remove
3. **Keep package-specific** - Framework APIs, domain rules, architecture
4. **Add skill references** - Point to relevant skills throughout
5. **Target 100-200 lines** - Thin wrapper, not comprehensive guide

### Example Migration

**Before** (500 lines):
- 300 lines universal patterns (arrow functions, testing, error handling)
- 200 lines package-specific (Teams.ai Memory API, Anthropic streaming)

**After** (150 lines):
- 50 lines references to skills
- 100 lines package-specific patterns
- Clear, focused, maintainable

## Document Type Comparison

Quick reference comparing all four document types:

| Aspect | Package README.md | Package AGENTS.md | Plugin README.md | Plugin AGENTS.md |
|--------|-------------------|-------------------|------------------|------------------|
| **Audience** | End users (integrators) | Developers (contributors) | End users (installers) | AI agents (discovery) |
| **Purpose** | How to use package | How to contribute | How to install plugin | How to discover commands |
| **Tone** | Encouraging, accessible | Directive, technical | Encouraging, accessible | Informative, minimal |
| **Length** | Any | 100-200 lines | Any | 30-50 lines |
| **Installation** | Single-platform npm | N/A (dev setup) | Multi-platform (Claude, Cursor, agents.md) | N/A |
| **Code Examples** | Usage examples | Side-by-side patterns | Usage examples | N/A |
| **Troubleshooting** | User issues | Dev environment issues | Multi-package-manager support | N/A |
| **Key Content** | Features, quick start, examples | Package-specific patterns, architecture | Platform-specific install, provider-agnostic issues | Trigger keywords, command file reference |
| **What to Avoid** | Technical jargon | Universal patterns (use skills) | Provider-specific titles | Duplicating command content |
| **Progressive Disclosure** | Collapsible sections | No | Collapsible per-platform | No |
| **Distribution** | Published to npm | Published to npm | GitHub Releases | Publicly hosted at api.you.com |

## Common Document Type Mistakes

### ❌ Wrong: Using Package Patterns for Plugin README
```markdown
# Plugin README (WRONG)

## Installation

npm install @youdotcom-oss/ai-sdk-plugin
```

**Problem**: Plugins need multi-platform installation (Claude Code, Cursor, agents.md)

### ✅ Right: Plugin README with Platform Variants
```markdown
# Plugin README (RIGHT)

## Installation

<details open>
<summary><strong>Claude Code</strong></summary>

**Option 1: Via install script (recommended)**
curl -fsSL ...install-plugin.sh | bash -s plugin-name --claude

**Option 2: Via marketplace**
First add the marketplace:
/plugin marketplace add youdotcom-oss/dx-toolkit
```

---

### ❌ Wrong: Plugin AGENTS.md with Full Workflow
```markdown
# Plugin AGENTS.md (WRONG)

## Integration Steps

1. First, ask the user which package manager...
2. Then, check if they have an existing setup...
3. Create the integration file...
[200 lines of detailed workflow]
```

**Problem**: Duplicates command file content, will drift out of sync

### ✅ Right: Plugin AGENTS.md as Thin Wrapper
```markdown
# Plugin AGENTS.md (RIGHT)

## When to Use

Trigger when developer mentions:
- "AI SDK integration"
- "Vercel AI SDK tools"

## Integration Instructions

**Fetch and follow the complete integration workflow:**

`commands/integrate-ai-sdk.md`
```

---

### ❌ Wrong: Package AGENTS.md with Universal Patterns
```markdown
# Package AGENTS.md (WRONG)

## Arrow Functions

Always use arrow functions...
[100 lines of examples]

## Testing

Use test() not it()...
[150 lines of examples]

## Package-Specific
[Only 50 lines buried at bottom]
```

**Problem**: Bloated with universal patterns, hard to maintain

### ✅ Right: Package AGENTS.md References Skills
```markdown
# Package AGENTS.md (RIGHT)

> For universal patterns: `.claude/skills/code-patterns`

## Package-Specific Patterns

### Teams.ai Memory API
Use `push()` not `addMessage()`...
[Only package-specific content]
```

## Related Skills

- `.claude/skills/code-patterns` - Universal code patterns
- `.claude/skills/git-workflow` - Git conventions
- `.claude/skills/package-creation` - Package setup workflow
