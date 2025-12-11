# MCP Server Performance Testing

> **General methodology**: See [root performance philosophy](../../../docs/PERFORMANCE.md) for core concepts, metrics, and methodology.

This document covers MCP server-specific performance testing details, including thresholds, test structure, and MCP-specific troubleshooting.

## MCP-Specific Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Processing lag** | < 100ms | Includes MCP stdio/JSON-RPC transport overhead while staying below perception threshold (~150-200ms) |
| **Overhead percentage** | < 50% | Accounts for fixed MCP overhead on fast API calls (e.g., 50ms overhead on 100ms API = 50%) |
| **Memory overhead** | < 400KB | Reasonable footprint for MCP server including client state, Zod schemas, and stdio communication buffers |

These thresholds account for the MCP server architecture:
- **Stdio transport**: Process IPC adds 20-40ms latency
- **JSON-RPC protocol**: Serialization/deserialization adds 10-20ms
- **Client SDK**: `@modelcontextprotocol/sdk` adds protocol overhead
- **Zod validation**: Schema validation adds 5-15ms per request
- **Response transformation**: Formatting for MCP output adds 5-10ms

## Test Suite Structure

### Test File Location
`packages/mcp/src/tests/processing-lag.spec.ts`

### APIs Tested

#### 1. Search API (`you-search` tool)
- **Endpoint**: `GET https://ydc-index.io/v1/search`
- **Authentication**: `X-API-Key` header
- **Iterations**: 10
- **Measures**: Web/news search processing lag

#### 2. Express API (`you-express` tool)
- **Endpoint**: `POST https://api.you.com/v1/agents/runs`
- **Authentication**: `Authorization: Bearer` header
- **Iterations**: 5 (AI processing is slower)
- **Timeout**: 60 seconds
- **Measures**: AI agent response processing lag

#### 3. Contents API (`you-contents` tool)
- **Endpoint**: `POST https://ydc-index.io/v1/contents`
- **Authentication**: `X-API-Key` header
- **Iterations**: 10
- **Measures**: Content extraction processing lag

#### 4. Memory Overhead
- **Operations**: All three tools executed 5 times
- **Method**: Heap size comparison with forced GC
- **Measures**: Sustained memory footprint

## Running Tests

### Basic Execution

```bash
cd packages/mcp

# Run processing lag tests
bun test src/tests/processing-lag.spec.ts

# Run with extended timeout (recommended)
bun test src/tests/processing-lag.spec.ts --timeout 120000
```

### Prerequisites

**Required**:
- `YDC_API_KEY` environment variable set
- Built MCP server binary (`bun run build`)

**Recommended**:
- Stable network connection (no VPN)
- Minimal system load
- Recent `bun install` (ensure dependencies up to date)

### Example Output

```
=== Search API Processing Lag ===
Raw API avg: 206.01ms
MCP tool avg: 161.13ms
Processing lag: -44.88ms
Overhead: -21.79%

=== Express API Processing Lag ===
Raw API avg: 627.50ms
MCP tool avg: 606.39ms
Processing lag: -21.11ms
Overhead: -3.36%

=== Contents API Processing Lag ===
Raw API avg: 164.23ms
MCP tool avg: 173.77ms
Processing lag: 9.55ms
Overhead: 5.81%

=== Memory Overhead ===
Heap before: 6130.11 KB
Heap after: 6385.85 KB
Heap growth: 255.74 KB

✓ All thresholds met
```

## Understanding Results

### Negative Processing Lag
**Example**: Search API shows -29.63ms lag (MCP faster than raw API)

**What it means**: Sometimes MCP tools are faster than raw API calls, resulting in negative lag values.

**Common causes**:
- **Network variability**: Small sample sizes (5-10 iterations) can show variance
- **Optimizations**: Response caching, connection pooling, or parallel processing offsetting overhead
- **Statistical noise**: Within margin of error for timing measurements
- **MCP efficiencies**: Optimized response transformation or reduced network roundtrips

**Is this a problem?** No! Negative lag indicates the MCP abstraction is not adding measurable overhead.

**What to focus on**:
- **Trend across multiple runs** rather than individual measurements
- **Outlier detection** helps filter network anomalies
- **Consistent positive lag > 100ms** is when investigation is needed

**Important**: Negative lag doesn't mean MCP magically makes APIs faster. It reflects that:
1. MCP overhead (stdio, JSON-RPC, validation) is minimal
2. Any overhead is within measurement noise
3. Test variance from network conditions

### Low Positive Lag (< 50ms)
**Example**: Contents API shows 9.55ms lag

**Causes**:
- Zod schema validation
- Response formatting
- Markdown transformation
- Normal MCP overhead

**Interpretation**: Excellent performance, minimal overhead from abstraction.

### Moderate Positive Lag (50-100ms)
**Interpretation**: Within acceptable threshold. Monitor for trends over time.

**Action**: No immediate action needed, but review if it increases.

### High Positive Lag (> 100ms)
**Interpretation**: Exceeds threshold, investigate optimizations.

**Action**: Profile code to identify bottlenecks (see troubleshooting below).

## MCP-Specific Troubleshooting

### Express API Timeout

**Symptom**: Test fails with timeout error

**Cause**: AI processing takes longer than default 5s timeout

**Solution**: Test already configured with 60s timeout:
```typescript
test.serial('Express API processing lag', async () => {
  // test body
}, { timeout: 60000 });
```

If still timing out:
- Check network stability
- Verify API key has agent endpoint permissions
- Increase timeout further if needed

### High Stdio Transport Overhead

**Symptom**: All tests show 50-80ms overhead

**Cause**: Stdio process spawning and IPC latency

**Investigation**:
```bash
# Test direct API calls (should be fast)
time curl -H "X-API-Key: $YDC_API_KEY" \
  "https://ydc-index.io/v1/search?query=test"

# Test MCP server directly (includes overhead)
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"you-search","arguments":{"query":"test"}},"id":1}' | \
  bun src/stdio.ts
```

**Normal Range**: 30-60ms additional latency from stdio transport

### Memory Growth Over Time

**Symptom**: Heap growth > 400KB or increasing over test runs

**Investigation**:
```bash
# Profile heap allocations
bun --heap-prof test src/tests/processing-lag.spec.ts

# Check for memory leaks
bun test src/tests/processing-lag.spec.ts --rerun-each 10
```

**Common Causes**:
- Client not properly cleaned up in `afterAll()`
- Event listeners not removed
- Response caching without bounds
- Zod schema objects duplicated

**Solution**: Review `beforeAll()` and `afterAll()` lifecycle:
```typescript
afterAll(async () => {
  await client.close();
  transport?.close();
  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});
```

### JSON-RPC Serialization Overhead

**Symptom**: Large responses show disproportionate overhead

**Investigation**: Check response sizes:
```typescript
const response = await client.callTool({
  name: 'you-search',
  arguments: { query: 'test', count: 10 }
});

console.log('Response size:', JSON.stringify(response).length);
```

**Optimization**: If responses are large (> 100KB):
- Consider pagination for large result sets
- Implement response streaming
- Add compression for text content
- Filter unnecessary fields before returning

### Rate Limiting

**Symptom**: Tests fail with 429 errors or show high variance

**Solution**: Adjust delays between iterations:
```typescript
// Current: 100ms delay
await new Promise(resolve => setTimeout(resolve, 100));

// Increase if rate limited:
await new Promise(resolve => setTimeout(resolve, 500));
```

### Warmup Not Completing

**Symptom**: First test always shows very high lag (> 500ms)

**Cause**: Warmup phase not completing properly

**Investigation**:
```typescript
beforeAll(async () => {
  console.log('Building MCP server...');
  await $`bun run build`;

  console.log('Starting MCP server...');
  // Ensure server starts fully

  console.log('Running warmup...');
  // Verify each warmup call completes
});
```

**Solution**: Add verification that warmup succeeds before measurements.

## Optimization Guidelines

### If Exceeding Thresholds

1. **Profile First**: Use `bun --cpu-prof` to identify hotspots
2. **Optimize Hotspots**: Focus on top 3 functions by time
3. **Measure Again**: Verify improvements with tests
4. **Document Changes**: Update this doc if thresholds change

### Common Optimizations

**Zod Schema Optimization**:
```typescript
// ❌ Recreating schema on each call
const schema = z.object({ ... });

// ✅ Define schema once at module level
const SearchInputSchema = z.object({ ... });
```

**Response Transformation**:
```typescript
// ❌ Multiple passes over data
const formatted = data.map(transform1).map(transform2);

// ✅ Single pass
const formatted = data.map(item => {
  const step1 = transform1(item);
  return transform2(step1);
});
```

**Async Batching**:
```typescript
// ❌ Sequential async operations
for (const item of items) {
  await process(item);
}

// ✅ Parallel when possible
await Promise.all(items.map(item => process(item)));
```

## Continuous Monitoring

### In CI/CD
Processing lag tests run automatically on:
- Every pull request
- Main branch commits
- Release workflows

**Failure Policy**: PR fails if any test exceeds threshold by > 20%

### Local Development
Run tests before committing:
```bash
bun test src/tests/processing-lag.spec.ts
```

Expected runtime: ~20-25 seconds

### Quarterly Review
Review thresholds every quarter:
1. Analyze trends over time
2. Adjust thresholds if architecture changes
3. Document changes in this file
4. Update tests if APIs change

## Related Documentation

- [Root Performance Philosophy](../../../docs/PERFORMANCE.md) - General methodology
- [API Documentation](./API.md) - MCP tool specifications
- [Development Guide](./AGENTS.md) - Contributing guidelines
- [Architecture](../README.md#architecture) - MCP server architecture
