---
name: typescript-lsp
description: Search TypeScript SYMBOLS (functions, types, classes) - NOT text. Use Glob to find files, Grep for text search, LSP for symbol search. Provides type-aware results that understand imports, exports, and relationships.
license: ISC
compatibility: Requires bun
allowed-tools: Bash, Read, Glob, Grep
metadata:
  file-triggers: "*.ts,*.tsx,*.js,*.jsx"
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

## When to Use Each Tool

| Tool | LSP Method | Purpose |
|------|-----------|---------|
| **Glob** | — | Find files by pattern |
| **Grep** | — | Search text content |
| `workspace/symbol` | symbol search | Find a TypeScript symbol by name across the workspace |
| `textDocument/hover` | hover | Get type signature + TSDoc at a position |
| `textDocument/references` | references | Find all usages of a symbol |
| `textDocument/documentSymbol` | doc symbols | List all symbols in a file |

### LSP vs Grep/Glob

| Task | Use LSP | Use Grep/Glob |
|------|---------|---------------|
| Find all usages of a function/type | ✅ `textDocument/references` | ❌ Misses re-exports, aliases |
| Search for a symbol by name | ✅ `workspace/symbol` | ❌ Matches strings, comments |
| Get type signature + TSDoc | ✅ `textDocument/hover` | ❌ Not possible |
| List all symbols in a file | ✅ `textDocument/documentSymbol` | ❌ Doesn't resolve re-exports |
| Find files by pattern | ❌ | ✅ `Glob` |
| Search non-TS files (md, json) | ❌ | ✅ `Grep` |
| Search for text in comments/strings | ❌ | ✅ `Grep` |

## When to Use

**Exploring code (prefer LSP):**
- `workspace/symbol` to search for a symbol by name across the workspace
- `textDocument/documentSymbol` to get an overview of all symbols in a file
- `textDocument/hover` to get the exact type signature at a position

**Before editing code:**
- `textDocument/references` to find all usages of a symbol you plan to modify
- `textDocument/hover` to verify current type signatures

**Before writing code:**
- `workspace/symbol` to find similar patterns or related symbols
- `textDocument/hover` on APIs you plan to use

## Server Invocation

The TypeScript Language Server is available locally and started via:

```bash
bun typescript-language-server --stdio
```

This launches the LSP server communicating over stdin/stdout using the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) — JSON-RPC messages with a `Content-Length` header followed by a newline-separated JSON body.

## Protocol

Each message is framed as:

```
Content-Length: <byte-length>\r\n
\r\n
<json-body>
```

### Initialization (required first)

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"processId":null,"rootUri":"file:///absolute/path/to/project","capabilities":{}}}
```

Follow with:

```json
{"jsonrpc":"2.0","method":"initialized","params":{}}
```

### Open a document

```json
{"jsonrpc":"2.0","method":"textDocument/didOpen","params":{"textDocument":{"uri":"file:///absolute/path/to/file.ts","languageId":"typescript","version":1,"text":"<file contents>"}}}
```

### Hover (type info at position)

```json
{"jsonrpc":"2.0","id":2,"method":"textDocument/hover","params":{"textDocument":{"uri":"file:///absolute/path/to/file.ts"},"position":{"line":42,"character":10}}}
```

Line and character are **0-indexed**.

### References (all usages of a symbol)

```json
{"jsonrpc":"2.0","id":3,"method":"textDocument/references","params":{"textDocument":{"uri":"file:///absolute/path/to/file.ts"},"position":{"line":42,"character":10},"context":{"includeDeclaration":true}}}
```

### Document symbols (all symbols in a file)

```json
{"jsonrpc":"2.0","id":4,"method":"textDocument/documentSymbol","params":{"textDocument":{"uri":"file:///absolute/path/to/file.ts"}}}
```

### Workspace symbol search (find symbol by name)

```json
{"jsonrpc":"2.0","id":5,"method":"workspace/symbol","params":{"query":"parseConfig"}}
```

### Shutdown

```json
{"jsonrpc":"2.0","id":99,"method":"shutdown","params":null}
{"jsonrpc":"2.0","method":"exit","params":null}
```

## Common Workflows

### Understanding a file

1. Initialize the server with the project root
2. `textDocument/didOpen` with the file's full text
3. `textDocument/documentSymbol` to list all symbols
4. `textDocument/hover` at positions of interest for type signatures

### Before modifying an export

1. `textDocument/hover` to confirm the current type signature
2. `textDocument/references` to find every call site
3. Review the response locations before making changes

### Finding a symbol across the workspace

1. Initialize with project root (tsconfig resolution depends on this)
2. `workspace/symbol` with the symbol name as the query

## Performance

A single `bun typescript-language-server --stdio` process handles the full session. Start it once, send all requests, then shutdown. Starting a new process per query costs ~300–500ms for server init each time.

## Related Skills

- **code-documentation**: TSDoc standards for documentation
