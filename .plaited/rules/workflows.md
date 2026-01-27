# Post-Package Creation Workflow

After creating a package with create-package command, follow these steps.

## 1. Implement Package Logic

**Actions:**
- Edit `packages/{name}/src/main.ts` - Export public API
- Add TSDoc to all exports
- Add tests in `src/tests/`

*Verify:* `cd packages/{name} && bun run check`

## 2. Create Package Skill (Optional)

**When needed:** Framework-specific patterns (50+ lines), not universal code patterns.

**Structure:** `.claude/skills/{package}-patterns/SKILL.md`

**Template:**
```markdown
---
name: {package}-patterns
description: {Package} patterns - [summary]
---
[Pattern sections with ✅/❌ examples]
```

*Verify:* `ls .claude/skills/{package}-patterns/SKILL.md`
*Update:* Add to AGENTS.md skill list (lines 11-18)

## 3. Add Performance Monitoring (Optional)

Only for API wrapper packages. See `.plaited/rules/performance-testing.md`.

*Verify:* `grep 'measure{Package}' scripts/performance/measure.ts`

## 4. Test Locally

```bash
cd packages/{name}
bun test && bun run check && bun run build  # If bundled
```

*Verify:* All pass before publishing

## 5. Test Publish (Prerelease)

**Actions:**
- Go to: `.github/workflows/publish-{name}.yml` → Run workflow
- Version: `0.1.0`, Next: `1` → Creates `0.1.0-next.1`

*Verify:* `npm view @youdotcom-oss/{name} versions`

## 6. Stable Release

**Actions:**
- Push to main
- Run workflow: Version `0.1.0`, no next value

*Verify:*
```bash
npm view @youdotcom-oss/{name} version
bun add @youdotcom-oss/{name}  # Test install
```

## Best Practices

- Test locally first - Don't publish broken code
- Use prerelease - Validate workflow before stable
- TSDoc over API.md - API docs in code
- 50+ line patterns → Create skill
