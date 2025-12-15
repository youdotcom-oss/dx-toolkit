---
name: code-patterns
description: Universal code patterns and best practices for dx-toolkit (Bun APIs, testing, error handling, type guards)
---

# Universal Code Patterns

Universal code patterns and best practices for dx-toolkit. Use these patterns consistently across all packages in the monorepo.

---

## Arrow Functions

Always use arrow functions for declarations

```ts
// ✅ Preferred
export const fetchData = async (params: Params) => { ... };

// ❌ Avoid
export async function fetchData(params: Params) { ... }
```

## Numeric Separators

Use underscores for large numbers (improves readability)

```ts
// ✅ Preferred
const timeout = 90_000; // 90 seconds
const maxSize = 1_000_000; // 1 million
const largeNumber = 1_234_567_890;

// ❌ Avoid
const timeout = 90000;
const maxSize = 1000000;
const largeNumber = 1234567890;
```

## No Unused Exports

All exports must be actively used

```bash
# Before adding exports, verify usage:
grep -r "ExportName" packages/
```

## Prefer Bun APIs Over Node.js APIs

Always use Bun-native APIs when available

```ts
// ✅ Preferred - Bun native APIs
import { $ } from 'bun';
import { heapStats } from 'bun:jsc';

// Path resolution (throws if not found - perfect for validation)
const path = Bun.resolveSync('./file.js', import.meta.dir);

// Shell commands
await $`ls -la`;
const output = await $`echo hello`.text();

// Sleep
await Bun.sleep(100);

// Garbage collection
Bun.gc(true);

// ❌ Avoid - Node.js APIs when Bun alternative exists
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
const path = require.resolve('./file.js');
await new Promise(resolve => setTimeout(resolve, 100));
```

**Why prefer Bun APIs?**
- Better performance (native implementation)
- Better TypeScript integration
- More predictable behavior in Bun runtime
- Clearer error messages (e.g., `Bun.resolveSync` throws with clear message)

**When Node.js APIs are acceptable:**
- No Bun equivalent exists
- Compatibility with Node.js runtime required
- Third-party package dependency requires it

## Bun Test Patterns

Always use `test()` in Bun tests, never `it()`

```ts
// ✅ Preferred - Bun test API
import { test, expect } from 'bun:test';

test('should validate input', () => {
  expect(true).toBe(true);
});

test('async operation', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// ❌ Avoid - Jest/Vitest syntax
import { it, expect } from 'bun:test';

it('should validate input', () => {  // Don't use it()
  expect(true).toBe(true);
});
```

**Why use test() not it()?**
- Our pattern and standard across dx-toolkit
- More explicit and clear than `it()`
- Consistent style throughout the monorepo

## Error Handling

Always use try/catch with typed error handling

```ts
// ✅ Preferred - typed error handling
try {
  const response = await apiCall();
  return formatResponse(response);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error(`API call failed: ${errorMessage}`);
  throw new Error(`Failed to process request: ${errorMessage}`);
}

// ❌ Avoid - untyped catch
try {
  const response = await apiCall();
  return formatResponse(response);
} catch (err) {  // Implicit 'any' type
  console.error(err.message);  // Unsafe property access
}

// ❌ Avoid - catch without type checking
catch (err: any) {
  console.error(err.message);  // 'any' defeats type safety
}
```

**Why typed error handling?**
- TypeScript requires explicit typing for catch clauses
- Prevents unsafe property access on unknown error types
- Forces proper type narrowing (instanceof Error check)
- Better error messages and debugging

## Test Retry Configuration

Use retry for API-dependent tests

```ts
// ✅ Preferred - API tests with retry
test('should fetch data from API', async () => {
  const response = await apiCall();
  expect(response).toBeDefined();
}, { timeout: 60_000, retry: 2 });

// ❌ Avoid - no retry for flaky API tests
test('should fetch data from API', async () => {
  const response = await apiCall();
  expect(response).toBeDefined();
}, { timeout: 60_000 });  // May fail on transient network issues
```

**Why use retry?**
- Handles transient network issues, rate limiting, intermittent failures
- Tests pass if any of 3 attempts succeed (1 initial + 2 retries)
- Low cost: only runs extra attempts on failure
- Standard pattern: `{ timeout: X, retry: 2 }`

**Considerations**:
- Total test time = iterations × max_attempts × time_per_iteration
- Use for API integration tests, not for unit tests
- Example: 5 iterations × 3 attempts × 7s/call = 105s max

## Test Assertion Anti-Patterns

Avoid patterns that silently skip assertions

```ts
// ❌ Avoid - early returns silently exit test
test('should validate item', () => {
  const item = getItem();
  if (!item) return;  // Test passes even if item is undefined!
  expect(item.name).toBe('test');
});

// ❌ Avoid - redundant conditionals
test('should have markdown property', () => {
  expect(item?.markdown).toBeDefined();
  if (item?.markdown) {  // Redundant check
    expect(typeof item.markdown).toBe('string');
  }
});

// ✅ Preferred - let tests fail naturally
test('should validate item', () => {
  const item = getItem();
  expect(item).toBeDefined();
  expect(item).toHaveProperty('name');
  expect(item?.name).toBe('test');
});

test('should have markdown property', () => {
  expect(item).toBeDefined();
  expect(item).toHaveProperty('markdown');  // Fails clearly if undefined
  expect(typeof item?.markdown).toBe('string');
});
```

**Why avoid these patterns?**
- Early returns make tests pass when they should fail
- Redundant conditionals create false confidence
- Tests should fail with clear error messages
- Use optional chaining with direct assertions

## Private Class Fields

Always use `#` private fields, never `private` keyword

```ts
// ✅ Preferred - JavaScript private fields (#)
export class AnthropicChatModel implements IChatModel {
  #anthropic: Anthropic;
  #model: string;
  #requestOptions?: AnthropicRequestOptions;
  #log: ILogger;

  constructor(options: AnthropicChatModelOptions) {
    this.#model = options.model;
    this.#requestOptions = options.requestOptions;
    this.#log = options.logger || new ConsoleLogger();
    this.#anthropic = new Anthropic({ apiKey: options.apiKey });
  }

  async send(input: Message): Promise<ModelMessage> {
    const response = await this.#anthropic.messages.create({
      model: this.#model,
      // ...
    });
  }
}

// ❌ Avoid - TypeScript private keyword
export class AnthropicChatModel implements IChatModel {
  private anthropic: Anthropic;
  private model: string;
  private requestOptions?: AnthropicRequestOptions;
  private log: ILogger;

  constructor(options: AnthropicChatModelOptions) {
    this.model = options.model;
    this.requestOptions = options.requestOptions;
    this.log = options.logger || new ConsoleLogger();
    this.anthropic = new Anthropic({ apiKey: options.apiKey });
  }
}
```

**Why use # private fields?**
- True runtime privacy (not just compile-time)
- JavaScript standard (TC39 Stage 4)
- Prevents accidental access in JavaScript
- More explicit intent than `private` keyword
- Works in both TypeScript and JavaScript
- Better encapsulation for class internals

## Type Guards

Prefer type guards over type casting for runtime type narrowing

```ts
// ✅ Preferred - Type guard functions
const isInputModelMessage = (input: Message): input is ModelMessage =>
  input.role === 'model' && Boolean(input?.function_calls);

const isHandler = (fn: unknown): fn is {
  (): unknown;
  handler: (args: unknown) => Promise<unknown>;
} => Boolean(fn && Object.hasOwn(fn, 'handler'));

// Usage - type-safe without casting
if (isInputModelMessage(input)) {
  // TypeScript knows input is ModelMessage here
  for (const call of input.function_calls) {
    const func = options.functions[call.name];
    if (isHandler(func)) {
      // TypeScript knows func has handler property here
      const result = await func.handler(call.arguments);
    }
  }
}

// ❌ Avoid - Type casting (loses type safety)
if ((input as ModelMessage).function_calls) {
  for (const call of (input as ModelMessage).function_calls) {
    const func = options.functions[call.name] as { handler: Function };
    const result = await func.handler(call.arguments);
  }
}
```

**Why prefer type guards over casting?**
- Native TypeScript type narrowing
- Explicit runtime checks with compile-time benefits
- Clear, reusable type predicates
- Type safety at call sites without assumptions
- Self-documenting type requirements

**When to use Zod for schema validation:**
Type guards are for internal type narrowing. Use Zod for schema validation:
- MCP tool input/output schemas (see `packages/mcp/src/*/schemas.ts`)
- API request/response validation
- Validating external input (user input, config files)
- Need detailed error messages for validation failures
- Sharing schemas between runtime and compile-time validation

## Resources

- [Bun Runtime Utils](https://bun.sh/docs/runtime/utils)
- [Bun Shell](https://bun.sh/docs/runtime/shell)
- [Bun Test](https://bun.sh/docs/cli/test)
