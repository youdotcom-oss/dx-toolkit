# Code Review Standards

The following standards are not automatically enforced by Biome but should be checked during code review.

## Automated Validation

Before completing a code review, run these validation scripts:

### Plugin Skills Validation

When changes touch `.claude/skills/` or `plugins/*/skills/`, validate against the AgentSkills spec by running:

```
/validate-skill
```

This checks:
- SKILL.md exists and has required frontmatter
- Scripts have proper structure
- References are valid markdown files

## TypeScript Comment Directives

### `@ts-ignore` Requires Description

- When using `@ts-ignore`, always include a description explaining why the type error is being suppressed
- This helps future maintainers understand the reasoning
- Example:
  ```typescript
  // @ts-ignore - TypeScript incorrectly infers this as string when it's actually a number from the API
  const value = response.data
  ```

**Rationale:** Lost TypeScript-ESLint rule `ban-ts-comment` with `allow-with-description` option during Biome migration

## Expression Statements

### Allow Short-Circuit and Ternary Expressions

- Short-circuit evaluation is acceptable: `condition && doSomething()`
- Ternary expressions are acceptable: `condition ? doThis() : doThat()`
- These patterns are idiomatic and improve code readability

**Rationale:** Lost TypeScript-ESLint rule `no-unused-expressions` with `allowShortCircuit` and `allowTernary` options during Biome migration

## Empty Object Types

### Allow Empty Object Types When Extending a Single Interface

- Empty object types are acceptable when they extend exactly one other interface
- This pattern is useful for creating branded types or extending third-party interfaces
- Example:
  ```typescript
  // ✅ Acceptable: Extends single interface
  interface CustomElement extends HTMLElement {}

  // ❌ Avoid: Empty with no extends or multiple extends
  interface Empty {}
  interface Multi extends Foo, Bar {}
  ```

**Rationale:** Lost TypeScript-ESLint rule `no-empty-object-type` with `allowInterfaces: 'with-single-extends'` option during Biome migration

## Modern JavaScript Standards

### Prefer Private Fields Over `private` Keyword

Use JavaScript private fields (`#field`) instead of TypeScript's `private` keyword:

```typescript
// ✅ Good: JavaScript private fields (ES2022+)
class EventBus {
  #listeners = new Map<string, Set<Function>>()
  #count = 0

  #emit(event: string) {
    this.#count++
    this.#listeners.get(event)?.forEach(fn => fn())
  }
}

// ❌ Avoid: TypeScript private keyword
class EventBus {
  private listeners = new Map<string, Set<Function>>()
  private count = 0

  private emit(event: string) {
    this.count++
    this.listeners.get(event)?.forEach(fn => fn())
  }
}
```

**Rationale:** JavaScript private fields are a runtime feature (ES2022) providing true encapsulation. TypeScript's `private` is erased at compile time and can be bypassed. Prefer platform standards over TypeScript-only features
