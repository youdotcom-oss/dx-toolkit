---
name: typescript-lsp
description: TypeScript Language Server for exploring and understanding TypeScript/JavaScript codebases. PREFER OVER Grep/Glob for *.ts/*.tsx files - provides type-aware symbol search, reference finding, and code navigation. Use for exploring code structure, finding implementations, understanding type relationships, and verifying signatures before editing.
license: ISC
compatibility: Bun >= 1.2.21, TypeScript >= 5.9.3
metadata:
  author: youdotcom-oss
  version: "1.0.0"
  category: development
  keywords: [typescript, lsp, code-exploration, type-checking, hover]
allowed-tools: Bash
---

# TypeScript LSP Skill

## Purpose

This skill provides TypeScript Language Server Protocol integration for **exploring and understanding** TypeScript/JavaScript codebases. 

**IMPORTANT**: Prefer LSP tools over Grep/Glob when working with `*.ts`, `*.tsx`, `*.js`, `*.jsx` files. LSP provides type-aware results that understand imports, exports, and symbol relationships.

Use these tools to:
- **Explore codebases** - Find symbols, understand module structure, discover implementations
- **Find references** - Type-aware search across the entire codebase (better than grep for symbols)
- **Understand types** - Get full type signatures, generics, and documentation
- **Verify before editing** - Check all usages before modifying or deleting exports
- **Navigate code** - Jump to definitions, find implementations

## When to Use LSP vs Grep/Glob

| Task | Use LSP | Use Grep/Glob |
|------|---------|---------------|
| Find all usages of a function/type | ✅ `lsp-references` | ❌ Misses re-exports, aliases |
| Search for a symbol by name | ✅ `lsp-find` | ❌ Matches strings, comments |
| Understand file exports | ✅ `lsp-analyze --exports` | ❌ Doesn't resolve re-exports |
| Get type signature | ✅ `lsp-hover` | ❌ Not possible |
| Find files by pattern | ❌ | ✅ `Glob` |
| Search non-TS files (md, json) | ❌ | ✅ `Grep` |
| Search for text in comments/strings | ❌ | ✅ `Grep` |

## When to Use

**Exploring code (prefer LSP):**
- Run `lsp-find` to search for symbols across the workspace
- Run `lsp-symbols` to get an overview of file structure
- Run `lsp-analyze --exports` to see what a module provides

**Before editing code:**
- Run `lsp-references` to find all usages of a symbol you plan to modify
- Run `lsp-hover` to verify current type signatures

**Before writing code:**
- Run `lsp-find` to search for similar patterns or related symbols
- Run `lsp-hover` on APIs you plan to use

## Path Resolution

All scripts accept three types of file paths:
- **Absolute paths**: `/Users/name/project/src/file.ts`
- **Relative paths**: `./src/file.ts` or `../other/file.ts`
- **Package export paths**: `plaited/main/b-element.ts` (resolved via `Bun.resolve()`)

Package export paths are recommended for portability and consistency with the package's exports field.

## Scripts

### Individual Scripts

#### lsp-hover
Get type information at a specific position.

```bash
bun scripts/lsp-hover.ts <file> <line> <char>
```

**Arguments:**
- `file`: Path to TypeScript/JavaScript file
- `line`: Line number (0-indexed)
- `char`: Character position (0-indexed)

**Example:**
```bash
bun scripts/lsp-hover.ts plaited/main/b-element.ts 139 13
```

#### lsp-symbols
List all symbols in a file.

```bash
bun scripts/lsp-symbols.ts <file>
```

**Example:**
```bash
bun scripts/lsp-symbols.ts plaited/main/b-element.ts
```

#### lsp-references
Find all references to a symbol.

```bash
bun scripts/lsp-references.ts <file> <line> <char>
```

**Example:**
```bash
bun scripts/lsp-references.ts plaited/main/b-element.ts 139 13
```

#### lsp-find
Search for symbols across the workspace.

```bash
bun scripts/lsp-find.ts <query> [context-file]
```

**Arguments:**
- `query`: Symbol name or partial name
- `context-file`: Optional file to open for project context

**Example:**
```bash
bun scripts/lsp-find.ts bElement
bun scripts/lsp-find.ts useTemplate plaited/main/use-template.ts
```

### Batch Script

#### lsp-analyze
Perform multiple analyses in a single session for efficiency.

```bash
bun scripts/lsp-analyze.ts <file> [options]
```

**Options:**
- `--symbols, -s`: List all symbols
- `--exports, -e`: List only exported symbols
- `--hover <line:char>`: Get type info (repeatable)
- `--refs <line:char>`: Find references (repeatable)
- `--all`: Run symbols + exports analysis

**Examples:**
```bash
# Get file overview
bun scripts/lsp-analyze.ts plaited/main/b-element.ts --all

# Check multiple positions
bun scripts/lsp-analyze.ts plaited/main/b-element.ts --hover 50:10 --hover 139:13

# Before refactoring: find all references
bun scripts/lsp-analyze.ts plaited/main/b-element.ts --refs 139:13
```

## Common Workflows

### Understanding a File

```bash
# 1. Get exports overview
bun scripts/lsp-analyze.ts path/to/file.ts --exports

# 2. For specific type info, hover on interesting symbols
bun scripts/lsp-hover.ts path/to/file.ts <line> <char>
```

### Before Modifying an Export

```bash
# 1. Find all references first
bun scripts/lsp-references.ts path/to/file.ts <line> <char>

# 2. Check what depends on it
# Review the output to understand impact
```

### Finding Patterns

```bash
# Search for similar implementations
bun scripts/lsp-find.ts createStyles
bun scripts/lsp-find.ts bElement
```

### Pre-Implementation Verification

```bash
# Before writing code that uses an API, verify its signature
bun scripts/lsp-hover.ts path/to/api.ts <line> <char>
```

## Output Format

All scripts output JSON to stdout. Errors go to stderr.

**Hover output:**
```json
{
  "contents": {
    "kind": "markdown",
    "value": "```typescript\nconst bElement: ...\n```"
  },
  "range": { "start": {...}, "end": {...} }
}
```

**Symbols output:**
```json
[
  {
    "name": "symbolName",
    "kind": 13,
    "range": { "start": {...}, "end": {...} }
  }
]
```

**Analyze output:**
```json
{
  "file": "path/to/file.ts",
  "exports": [
    { "name": "exportName", "kind": "Constant", "line": 139 }
  ]
}
```

## Performance

Each script invocation:
1. Starts TypeScript Language Server (~300-500ms)
2. Initializes LSP connection
3. Opens document
4. Performs query
5. Closes and stops

For multiple queries on the same file, use `lsp-analyze` to batch operations in a single session.

## Plaited-Specific Verification

See [lsp-verification.md](references/lsp-verification.md) for Plaited framework type verification patterns:
- When to use LSP for Plaited APIs (bElement, createStyles, bProgram)
- Example workflow for verifying BProgramArgs, callbacks, and helper methods
- Critical files to verify (b-element.types.ts, css.types.ts, behavioral.types.ts)
- Integration with code generation workflow

## Related Skills

- **plaited-standards**: Code conventions and development standards
- **plaited-behavioral-core**: Behavioral programming patterns
- **plaited-ui-patterns**: Templates, bElements, and styling
- **code-documentation**: TSDoc standards for documentation
