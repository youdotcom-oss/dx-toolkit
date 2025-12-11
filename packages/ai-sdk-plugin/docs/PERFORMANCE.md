# AI SDK Plugin Performance Testing

> **General methodology**: See [root performance philosophy](../../../docs/PERFORMANCE.md) for core concepts, metrics, and methodology.

This document covers ai-sdk-plugin-specific performance testing details, including thresholds, test structure, and package-specific troubleshooting.

## Package-Specific Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Processing lag** | < 80ms | SDK integration with moderate validation and transformation. Includes AI SDK tool() wrapper overhead, Zod schema validation, response formatting, and error handling |
| **Overhead percentage** | < 35% | Acceptable relative overhead for abstraction layer that provides type safety, input validation, and consistent error handling across three different You.com APIs |
| **Memory overhead** | < 350KB | Memory requirements for tool metadata, Zod schemas, and response transformation. Each tool instance maintains minimal state (API key, schema definitions) |

**Architecture considerations**:

The AI SDK plugin adds the following overhead sources compared to raw API calls:

1. **AI SDK `tool()` wrapper** - Tool registration, metadata, and execution context
2. **Zod validation** - Input schema validation for all three tools
3. **MCP utility layer** - Uses `@youdotcom-oss/mcp` for API calls and response formatting
4. **Response transformation** - Converting API responses to AI SDK tool result format (`{ text, data }`)
5. **Error handling** - Consistent error handling and validation across all tools

These thresholds reflect **SDK integration** complexity (moderate validation/transformation), which is higher than thin library wrappers but lower than MCP servers with transport overhead.

## Test Suite Structure

### Test File Location
`packages/ai-sdk-plugin/src/tests/processing-lag.spec.ts`

### APIs Tested

#### API 1: Search API
- **Endpoint**: `GET https://api.ydc-index.io/search`
- **Authentication**: `X-API-Key` header
- **Iterations**: 10
- **Timeout**: 60s
- **Retry**: 2 (3 total attempts)
- **Measures**: Overhead of `youSearch()` tool wrapper vs raw fetch + JSON parse

#### API 2: Express API
- **Endpoint**: `POST https://api.you.com/express`
- **Authentication**: `Authorization: Bearer` header
- **Iterations**: 10
- **Timeout**: 60s
- **Retry**: 2 (3 total attempts)
- **Measures**: Overhead of `youExpress()` tool wrapper vs raw fetch + JSON parse

#### API 3: Contents API
- **Endpoint**: `POST https://api.ydc-index.io/contents`
- **Authentication**: `X-API-Key` header
- **Iterations**: 10
- **Timeout**: 60s
- **Retry**: 2 (3 total attempts)
- **Measures**: Overhead of `youContents()` tool wrapper vs raw fetch + JSON parse

### Memory Test
- **Iterations**: 5
- **Timeout**: 30s
- **Retry**: 2 (3 total attempts)
- **Measures**: Heap growth from plugin abstraction (tool instances, schemas, formatters)

## Running Tests

### Basic Execution

```bash
cd packages/ai-sdk-plugin

# Run processing lag tests
bun test src/tests/processing-lag.spec.ts

# Run with extended timeout if needed
bun test src/tests/processing-lag.spec.ts --timeout 90000
```

### Prerequisites

**Required**:
- `YDC_API_KEY` environment variable set
- `ANTHROPIC_API_KEY` environment variable set (for AI SDK)
- Stable network connection (no VPN recommended)

**Recommended**:
- Minimal system load
- Recent `bun install` to ensure dependencies are up to date

### Example Output

```
=== Warming up ===
Running warmup calls to eliminate cold start effects...
Warmup complete. Starting measurements...

=== Search API Processing Lag ===
Raw API avg: 450.23ms
Plugin avg: 485.67ms
Processing lag: 35.44ms
Overhead: 7.87%

=== Express API Processing Lag ===
Raw API avg: 1250.45ms
Plugin avg: 1295.12ms
Processing lag: 44.67ms
Overhead: 3.57%

=== Contents API Processing Lag ===
Raw API avg: 890.34ms
Plugin avg: 925.78ms
Processing lag: 35.44ms
Overhead: 3.98%

=== Memory Overhead ===
Heap before: 15234.56 KB
Heap after: 15456.78 KB
Heap growth: 222.22 KB

✓ All thresholds met
```

## Understanding Results

### Negative Processing Lag

**Rare but possible**. Negative lag means plugin was faster than raw API call, which can occur due to:
- Measurement noise in small samples
- Cache effects between iterations
- Network timing variations

**Action**: No action needed if within ~10ms. Performance metrics average out over 10 iterations.

### Low Positive Lag (< 40ms, < 20%)

**Expected and good**. Indicates efficient abstraction layer with minimal overhead:
- Zod validation is fast on simple schemas
- Response formatting is minimal
- MCP utilities are well-optimized

**Action**: No action needed. This is healthy performance.

### High Positive Lag (> 80ms or > 35%)

**Investigate if consistent**. Could indicate:
- Complex response transformations taking too long
- Inefficient Zod schema validation
- Memory pressure causing GC pauses
- Network issues affecting measurements

**Action**: Run tests multiple times. If consistently high, investigate with profiling.

## Package-Specific Troubleshooting

### High Overhead in Search API

**Symptom**: Search API shows >80ms lag or >35% overhead consistently

**Cause**: Complex response formatting or schema validation overhead

**Solution**:
```bash
# Check if formatting is the bottleneck
bun test src/tests/processing-lag.spec.ts --timeout 90000

# Profile the formatSearchResults function
# Add console.time/timeEnd around formatting calls
```

### High Memory Overhead

**Symptom**: Memory test shows >350KB heap growth

**Cause**: Tool instances or schemas holding unnecessary references

**Solution**:
```bash
# Force GC between measurements
# Check for memory leaks in tool instance creation

# Verify Zod schemas aren't holding large objects
grep -r "z\\.lazy\\|z\\.promise" src/
```

### Retry Exhaustion

**Symptom**: Tests fail even after 3 attempts (1 initial + 2 retries)

**Cause**: API rate limiting, network issues, or API key issues

**Solution**:
```bash
# Check API key is valid
echo $YDC_API_KEY

# Verify API connectivity
curl -H "X-API-Key: $YDC_API_KEY" https://api.ydc-index.io/search?query=test

# Check rate limits with fewer iterations
# Edit test file and reduce iterations from 10 to 5
```

### Flaky Results

**Symptom**: Processing lag varies widely between runs (e.g., 20ms to 100ms)

**Cause**: Network variability, system load, or thermal throttling

**Solution**:
- Close other applications to reduce system load
- Disable VPN during testing
- Run tests on stable network (not WiFi if possible)
- Increase iterations from 10 to 20 for more stable averages

## Optimization Guidelines

### Tool Wrapper Optimization

**Current**: Each tool creates instances on demand
**Optimization**: Reuse tool instances when possible

```typescript
// ✅ Reuse tool instance
const searchTool = youSearch({ apiKey: YDC_API_KEY });
await searchTool.execute?.({ query: 'test1' }, { toolCallId: '1', messages: [] });
await searchTool.execute?.({ query: 'test2' }, { toolCallId: '2', messages: [] });

// ❌ Create new instance each time
await youSearch({ apiKey: YDC_API_KEY }).execute?.({ query: 'test1' }, { ... });
await youSearch({ apiKey: YDC_API_KEY }).execute?.({ query: 'test2' }, { ... });
```

### Schema Validation Optimization

**Current**: Schemas validated on every call
**Note**: This is necessary for type safety - do not disable

### Response Formatting Optimization

**Current**: Full response transformation
**Optimization**: Only transform fields actually used by AI SDK

## Continuous Monitoring

### In CI/CD

Processing lag tests run automatically on:
- Every pull request
- Main branch commits
- Release workflows

Tests must pass before merging to ensure performance regressions are caught early.

### Local Development

Run tests before committing:
```bash
cd packages/ai-sdk-plugin
bun test src/tests/processing-lag.spec.ts
```

Monitor for performance regressions when:
- Adding new tool parameters
- Modifying response formatting
- Updating Zod schemas
- Upgrading `@youdotcom-oss/mcp` dependency

## Related Documentation

- [Root Performance Philosophy](../../../docs/PERFORMANCE.md) - General methodology
- [Package README](../README.md) - Package overview
- [Development Guide](../AGENTS.md) - Contributing guidelines
- [Integration Tests](../src/tests/integration.spec.ts) - Functional correctness tests
