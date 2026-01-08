---
name: documentation
description: Documentation standards for README.md and AGENTS.md files - tone, structure, thin AGENTS.md philosophy
---

# Documentation Standards

Complete documentation standards for dx-toolkit packages. Use these guidelines when creating or updating README.md and AGENTS.md files.

---

## Root README.md - Monorepo Overview

**IMPORTANT**: The root `README.md` (at monorepo level) is an exception to package-specific guidelines.

**Purpose**: Clean navigation document for developers (integrators + contributors)

**Structure**:
1. **Title and intro** - Multi-platform toolkit (Claude Code, Cursor, 20+ AI agents)
2. **NPM Packages** - One-liner per package with Documentation link
3. **Marketplace** - One-liner per plugin with Documentation link (match NPM Packages format)
4. **Quick Start** - Development setup only (prerequisites + setup commands)
5. **Monorepo Commands** - Workspace-level and package-specific commands
6. **Documentation** - Package docs and contributor docs links
7. **Directory Structure** - Basic structure overview
8. **Roadmap** - Packages and plugins in development (link to docs/ROADMAP.md)
9. **Contributing** - Link to CONTRIBUTING.md
10. **License and Support** - Standard sections

**Key Principles**:
- ✅ Single Quick Start for development setup - No separate user/contributor sections
- ✅ Unified format - NPM Packages and Marketplace use same one-liner pattern
- ✅ Link to detailed docs - Don't duplicate AGENTS.md or package READMEs
- ✅ Show both command patterns - Root shortcuts AND `bun --cwd packages/<package> <command>`
- ✅ Complete environment setup - Both YDC_API_KEY and ANTHROPIC_API_KEY
- ✅ Build before test - `bun run build` then `bun test` in Quick Start
- ✅ Reflect current state - Update roadmap for upcoming work
- ❌ Don't separate "For Users" vs "For Contributors" - Single flow
- ❌ Don't duplicate Testing/Code Quality sections - Covered in Monorepo Commands
- ❌ Don't include "Working with AI Agents" section - Link to AGENTS.md instead
- ❌ Don't include "GitHub Workflows" section - Link to AGENTS.md instead
- ❌ Don't use `<details>` for progressive disclosure - Keep simple and linear

**Quick Start Pattern**:
```markdown
## Quick Start

**Prerequisites:**
- Bun >= 1.2.21: [Installation guide](https://bun.sh/docs/installation)
- GitHub CLI (recommended): `brew install gh` (macOS) or [other platforms](...)

**Development setup:**
```bash
# Clone repository
git clone git@github.com:youdotcom-oss/dx-toolkit.git
cd dx-toolkit

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env and add your YDC_API_KEY and ANTHROPIC_API_KEY
source .env

# Authenticate with GitHub (if using gh CLI)
gh auth login

# Build all packages
bun run build

# Run all tests
bun test

# Run all quality checks
bun run check
```

**For comprehensive development guidelines**, see [AGENTS.md](./AGENTS.md).
```

**Package/Plugin Listing Pattern** (One-liner with link):
```markdown
### [@youdotcom-oss/mcp](./packages/mcp/)
MCP Server giving AI agents real-time web search, AI answers, and content extraction via Model Context Protocol. **[Documentation →](./packages/mcp/README.md)**

### [teams-anthropic-integration](./plugins/teams-anthropic-integration/)
Generate Microsoft Teams apps with You.com Anthropic integration using `@youdotcom-oss/teams-anthropic` - handles setup workflow for new and existing apps. **[Documentation →](./plugins/teams-anthropic-integration/README.md)**
```

**Contributing Pattern** (Just link):
```markdown
## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
```

**Target Length**: ~200 lines (down from 300-400 with removed sections)

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
- Arrow functions, Bun APIs → `.claude/rules/code-patterns.md`
- Test patterns, retry config → `.claude/rules/code-patterns.md`
- Error handling (`err: unknown`) → `.claude/rules/code-patterns.md`
- Type guards, private fields → `.claude/rules/code-patterns.md`
- Git workflow, commits → `.claude/rules/git-workflow.md`
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

> **For universal patterns**: See `.claude/rules/code-patterns.md`

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
- `.claude/rules/code-patterns.md` - Universal patterns
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
> For universal patterns: `.claude/rules/code-patterns.md`

## Quick Start
[2-3 commands only]

## Code Style
> See `.claude/rules/code-patterns.md`

## Package-Specific Patterns
[Only patterns unique to this package's domain]

## Testing
> For universal patterns: `.claude/rules/code-patterns.md`

### Package-Specific Testing
[Only if truly unique to this package]

## Related Skills
[List of relevant skills]
```

**Target Length**: 100-200 lines (not 500+)

### Plugin README.md - Multi-Platform Installation Guide

**Audience**: End users (developers installing and using skills)

**Tone**: Encouraging and accessible (same as package README)

**Note**: Plugins in this repository use the [agent-skills-spec](https://code.claude.com/docs/en/plugins#plugin-structure-overview) format. Skills are defined in `skills/{skill-name}.md` files using YAML frontmatter + Markdown body.

**Key Differences from Package README**:
1. **Multi-platform installation** - Claude Code, Cursor, and universal agents
2. **Progressive disclosure per platform** - Use `<details>` tags for each platform
3. **Multiple installation options** - Install script (recommended) + manual marketplace
4. **Critical command order** - Marketplace add BEFORE skill install
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

**Use the skill:**

Claude Code automatically discovers skills from marketplace.json.

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --cursor
```

Then enable in Cursor:
1. Open **Settings → Rules → Import Settings**
2. Toggle **"Claude skills and plugins"**

Cursor will automatically discover and use the skills.

See [Cursor Rules Documentation](https://cursor.com/docs/context/rules#claude-skills-and-plugins)

</details>

<details>
<summary><strong>Other AI Agents</strong></summary>

For Cody, Continue, Codex, Jules, VS Code, and more:

```bash
curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s {plugin-name} --agents.md
```

Your AI agent will automatically discover the skills via marketplace.json.

</details>
```

**Troubleshooting Section Pattern** (Multiple Package Managers):
```markdown
<details>
<summary><strong>Cannot find module @youdotcom-oss/{package-name}</strong></summary>

The skill should have installed it automatically. If not, run:

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

### Plugin Skills Structure

**Current Structure**: Plugins use the [agent-skills-spec](https://code.claude.com/docs/en/plugins#plugin-structure-overview) format:

```
plugins/{plugin-name}/
├── skills/
│   └── {skill-name}.md       # Agent-skills-spec format (YAML frontmatter + Markdown)
├── README.md                  # User documentation
├── src/                       # Integration code (if any)
└── tests/                     # Tests (if any)
```

**Distribution**: Skills are distributed via marketplace.json which references `./plugins/{plugin-name}/skills/{skill-name}.md`. Users install via:
- `git clone` + marketplace add (for all skills)
- Install script (automates marketplace configuration)

**No separate AGENTS.md files**: Plugin structure no longer includes `.claude-plugin/plugin.json`, `commands/`, or `AGENTS.md` files. The skill file in `skills/` directory serves as the complete specification

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
> **For universal patterns**: See `.claude/rules/code-patterns.md`

---

## Quick Start

\`\`\`bash
cd packages/{package-name}
bun install
bun test
\`\`\`

## Code Style

> **For universal patterns**: See `.claude/rules/code-patterns.md`

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

> **For universal patterns**: See `.claude/rules/code-patterns.md`

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
- `.claude/rules/code-patterns.md` - Universal code patterns
- `.claude/skills/documentation` - Documentation standards
- `.claude/rules/git-workflow.md` - Git conventions

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
- [ ] References `.claude/rules/code-patterns.md` upfront
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
- [ ] Links to package README and skill documentation in `skills/` directory

### Plugin Skills Checklist (agent-skills-spec format):
- [ ] Skill file located in `plugins/{plugin-name}/skills/{skill-name}.md`
- [ ] Has YAML frontmatter with name, description, license, compatibility, metadata
- [ ] Description is concise (max 1024 chars) and explains when to trigger
- [ ] Markdown body contains complete workflow, templates, validation, troubleshooting
- [ ] Referenced in marketplace.json with path `./plugins/{plugin-name}/skills/{skill-name}.md`
- [ ] No `.claude-plugin/` directory (not using Claude Code plugin format)
- [ ] No `commands/` directory (workflow is in skill file itself)
- [ ] No `AGENTS.md` file at plugin root (skill file serves this purpose)

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

> For universal patterns: `.claude/rules/code-patterns.md`

## Package-Specific Patterns

### Teams.ai Memory API
[50 lines of package-specific patterns]

### Anthropic Streaming
[50 lines of package-specific patterns]

## Related Skills
- `.claude/skills/teams-ai-patterns`
- `.claude/rules/code-patterns.md`
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

Quick reference comparing three document types:

| Aspect | Package README.md | Package AGENTS.md | Plugin README.md |
|--------|-------------------|-------------------|------------------|
| **Audience** | End users (integrators) | Developers (contributors) | End users (installers) |
| **Purpose** | How to use package | How to contribute | How to install skills |
| **Tone** | Encouraging, accessible | Directive, technical | Encouraging, accessible |
| **Length** | Any | 100-200 lines | Any |
| **Installation** | Single-platform npm | N/A (dev setup) | Multi-platform (Claude, Cursor, agents.md) |
| **Code Examples** | Usage examples | Side-by-side patterns | Usage examples |
| **Troubleshooting** | User issues | Dev environment issues | Multi-package-manager support |
| **Key Content** | Features, quick start, examples | Package-specific patterns, architecture | Platform-specific install, provider-agnostic issues |
| **What to Avoid** | Technical jargon | Universal patterns (use skills) | Provider-specific titles |
| **Progressive Disclosure** | Collapsible sections | No | Collapsible per-platform |
| **Distribution** | Published to npm | Published to npm | Via marketplace.json and git clone |

## Common Document Type Mistakes

### ❌ Wrong: Using Package Patterns for Plugin README
```markdown
# Plugin README (WRONG)

## Installation

npm install @youdotcom-oss/ai-sdk-plugin
```

**Problem**: Skills need multi-platform installation (Claude Code, Cursor, agents.md)

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

### ❌ Wrong: Using Old Claude Code Plugin Format
```markdown
# plugins/my-skill/ (WRONG)

├── .claude-plugin/
│   └── plugin.json
├── AGENTS.md
└── commands/
    └── my-command.md
```

**Problem**: This is the old Claude Code plugin format. Now use agent-skills-spec format.

### ✅ Right: Agent-Skills-Spec Format
```markdown
# plugins/my-skill/ (RIGHT)

├── skills/
│   └── my-skill.md          # YAML frontmatter + Markdown
├── README.md
└── src/                      # Optional integration code
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

> For universal patterns: `.claude/rules/code-patterns.md`

## Package-Specific Patterns

### Teams.ai Memory API
Use `push()` not `addMessage()`...
[Only package-specific content]
```

## Related Skills

- `.claude/rules/code-patterns.md` - Universal code patterns
- `.claude/rules/git-workflow.md` - Git conventions
- `.claude/rules/workflows.md` - Package setup workflow
