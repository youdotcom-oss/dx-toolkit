# Bun APIs

**Prefer Bun over Node.js** when running in Bun environment.

**File system:**
- `Bun.file(path).exists()` not `fs.existsSync()`
- `Bun.file(path).text()` not `readFileSync()`
- `Bun.write(path, data)` not `writeFileSync()`
*Verify:* `grep 'from .node:fs' src/`  
*Fix:* Replace with Bun.file/Bun.write

**Shell commands:**
- `Bun.$\`cmd\`` not `child_process.spawn()`
*Verify:* `grep 'child_process' src/`  
*Fix:* Replace with Bun.$ template literal

**Path resolution:**
- `Bun.resolveSync()` for module resolution
- `import.meta.dir` for current directory
- Keep `node:path` for join/resolve/dirname
*Verify:* Check for `process.cwd()` misuse

**Executables:**
- `Bun.which(cmd)` to check if command exists
- `Bun.$\`bun add pkg\`` for package management

**When Node.js OK:** readline (interactive input), node:path utilities, APIs without Bun equivalents

**Docs:** https://bun.sh/docs
