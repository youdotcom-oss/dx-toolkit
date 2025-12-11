# Performance Testing

This package includes processing lag tests to measure the overhead introduced by our MCP abstraction layer compared to raw You.com API calls.

## Overview

The processing lag test suite quantifies the overhead our code adds when wrapping You.com APIs. We cannot improve the You.com API performance itself, but we monitor what lag our MCP server abstraction introduces to ensure it remains minimal.

## What We Measure

### Processing Lag
**Absolute time difference** between raw API calls and MCP tool calls.
- Measured in milliseconds (ms)
- Calculated as: `MCP tool time - Raw API time`
- Example: If raw API takes 500ms and MCP tool takes 535ms, processing lag is 35ms

### Overhead Percentage
**Relative overhead** as a percentage of raw API time.
- Expressed as a percentage (%)
- Calculated as: `(Processing lag / Raw API time) × 100`
- Example: 35ms lag on 500ms raw API = 7% overhead

### Memory Overhead
**Heap growth** from our abstraction layer.
- Measured in kilobytes (KB)
- Calculated by comparing heap size before and after operations
- Includes memory for data transformation, validation, and formatting

## Acceptable Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Processing lag** | < 100ms | Includes MCP stdio/JSON-RPC transport overhead while staying below perception threshold (~150-200ms) |
| **Overhead percentage** | < 50% | Accounts for fixed MCP overhead on fast API calls (e.g., 50ms overhead on 100ms API = 50%) |
| **Memory overhead** | < 400KB | Reasonable footprint for MCP server including client state, schemas, and communication buffers |

These thresholds ensure the MCP server adds negligible overhead while providing valuable abstraction benefits (validation, formatting, error handling).

## Test Suite Structure

### Test File
`packages/mcp/src/tests/processing-lag.spec.ts`

### Test Organization

1. **Warmup Phase**
   - Runs before measurements to eliminate cold start effects
   - Calls each MCP tool once
   - Ensures JIT compilation and module loading are complete

2. **Search API Processing Lag**
   - Compares raw `GET https://ydc-index.io/v1/search` vs `you-search` tool
   - Measures 10 iterations and calculates average
   - Tests authentication via `X-API-Key` header

3. **Express API Processing Lag**
   - Compares raw `POST https://api.you.com/v1/agents/runs` vs `you-express` tool
   - Measures 10 iterations and calculates average
   - Tests authentication via `Authorization: Bearer` header

4. **Contents API Processing Lag**
   - Compares raw `POST https://ydc-index.io/v1/contents` vs `you-contents` tool
   - Measures 10 iterations and calculates average
   - Tests authentication via `X-API-Key` header

5. **Memory Overhead**
   - Measures heap growth across multiple operations
   - Forces garbage collection before and after measurements
   - Calculates sustained memory overhead

## Running Tests

### Basic Execution

```bash
# Run all processing lag tests
bun test src/tests/processing-lag.spec.ts

# Run with verbose output
bun test src/tests/processing-lag.spec.ts --verbose
```

### Advanced Options

```bash
# Run with multiple iterations for reliability
bun test --rerun-each 100 src/tests/processing-lag.spec.ts

# Run with extended timeout for slow connections
bun test --timeout 60000 src/tests/processing-lag.spec.ts

# Generate CPU profile to identify bottlenecks
bun --cpu-prof test src/tests/processing-lag.spec.ts
```

### Prerequisites

- `YDC_API_KEY` environment variable must be set
- Stable network connection (avoid VPN for consistent results)
- Minimal system load (close resource-intensive applications)

## Interpreting Results

### Example Output

```
=== Search API Processing Lag ===
Raw API avg: 523.45ms
MCP tool avg: 558.12ms
Processing lag: 34.67ms
Overhead: 6.62%

=== Express API Processing Lag ===
Raw API avg: 1245.23ms
MCP tool avg: 1282.56ms
Processing lag: 37.33ms
Overhead: 3.00%

=== Contents API Processing Lag ===
Raw API avg: 892.34ms
MCP tool avg: 925.67ms
Processing lag: 33.33ms
Overhead: 3.74%

=== Memory Overhead ===
Heap before: 12345.67 KB
Heap after: 12389.23 KB
Heap growth: 43.56 KB
```

### What These Numbers Mean

- **Raw API time**: Baseline performance of You.com API (we cannot improve this)
- **MCP tool time**: Total time including our abstraction layer
- **Processing lag**: The overhead we add (validation, transformation, formatting)
- **Overhead %**: Relative impact of our code on total execution time

### Acceptable Results

✅ **Pass**: All thresholds met
- Processing lag < 50ms
- Overhead < 10%
- Memory < 100KB

⚠️ **Warning**: One threshold exceeded by < 20%
- Review recent changes
- Consider optimization if consistent

❌ **Fail**: One or more thresholds exceeded by > 20%
- Investigate code changes since last passing test
- Profile with CPU profiler to identify bottlenecks
- Review data transformation and validation logic

## Troubleshooting

### Test Failures

#### High Processing Lag (> 50ms)

**Possible Causes:**
- Excessive data transformation or copying
- Synchronous operations blocking execution
- Redundant validation or parsing

**Debugging Steps:**
1. Run with CPU profiler: `bun --cpu-prof test src/tests/processing-lag.spec.ts`
2. Identify hot paths in profile output
3. Check for:
   - Unnecessary JSON.stringify/parse cycles
   - Deep object cloning
   - Synchronous I/O operations

#### High Overhead Percentage (> 10%)

**Possible Causes:**
- Fast API responses amplify relative overhead
- Cold start effects not eliminated by warmup
- Network variability affecting baseline measurements

**Debugging Steps:**
1. Increase iterations: `bun test --rerun-each 100`
2. Check network stability (ping test to API)
3. Review warmup phase completeness

#### High Memory Overhead (> 100KB)

**Possible Causes:**
- Memory leaks in transformation logic
- Large object allocations not being garbage collected
- String concatenation instead of array joining

**Debugging Steps:**
1. Review heap snapshots before/after operations
2. Check for circular references preventing GC
3. Use `WeakMap`/`WeakSet` for cache storage
4. Profile with: `bun --heap-prof test`

### Network Variability

Processing lag tests are sensitive to network conditions:

**Best Practices:**
- Run tests multiple times to get consistent baselines
- Avoid running during network congestion
- Disable VPN for more consistent results
- Use `--rerun-each` to average out variability

### CI Failures

If tests pass locally but fail in CI:

1. **Check CI environment:**
   - CPU throttling on shared runners
   - Network latency differences
   - Parallel test execution affecting results

2. **Adjust thresholds for CI:**
   - Consider separate thresholds for CI vs local
   - Use conditional thresholds based on `CI` environment variable

3. **Skip flaky tests temporarily:**
   - Mark as `test.skip` with issue reference
   - Create Linear issue to investigate

## CI Integration

Processing lag tests run automatically in CI to detect performance regressions.

### Workflow Configuration

Tests are executed in `.github/workflows/ci.yml`:

```yaml
- name: Run processing lag tests
  run: |
    bun test src/tests/processing-lag.spec.ts \
      --timeout 60000
  env:
    YDC_API_KEY: ${{ secrets.YDC_API_KEY }}
```

### Failure Handling

When processing lag tests fail in CI:

1. **Review the PR changes:**
   - Check for new dependencies
   - Look for data transformation changes
   - Review validation logic modifications

2. **Compare with baseline:**
   - Check main branch test results
   - Look for consistent patterns across runs
   - Identify if it's a regression or environmental

3. **Take action:**
   - If regression: Fix the performance issue before merging
   - If environmental: Retrigger CI or investigate runner issues
   - If threshold too strict: Discuss adjustment with team

## Optimization Guidelines

If you need to optimize processing lag:

### 1. Profile First
Never optimize without profiling. Use CPU and heap profilers to identify actual bottlenecks:

```bash
# CPU profiling
bun --cpu-prof test src/tests/processing-lag.spec.ts

# Heap profiling
bun --heap-prof test src/tests/processing-lag.spec.ts
```

### 2. Common Optimizations

**Data Transformation:**
- Avoid unnecessary JSON serialization/deserialization
- Use object spread only when needed (shallow copies are faster)
- Prefer `Array.map()` over manual loops for transformations

**Validation:**
- Cache Zod schemas (already done in our code)
- Use `.passthrough()` instead of strict parsing when possible
- Consider lazy validation for optional fields

**String Operations:**
- Use array join for multi-part strings instead of concatenation
- Prefer template literals for readability, they're optimized by V8
- Avoid repeated string replacements

**Memory:**
- Reuse objects when safe (e.g., header objects)
- Avoid creating intermediate arrays/objects
- Use `const` to signal immutability to optimizer

### 3. Verify Improvements

After optimization:
1. Run processing lag tests: `bun test src/tests/processing-lag.spec.ts`
2. Compare before/after metrics
3. Verify thresholds are met
4. Check that functionality is unchanged (run other tests)

## Background: Why We Test Processing Lag

### The Problem

Users perceive latency holistically. If our MCP server adds 100ms to a 500ms API call (20% overhead), that's noticeable and frustrating. But if we add 30ms (6% overhead), it's imperceptible while providing valuable benefits:

- Input validation (prevent bad API calls)
- Response transformation (structured data for clients)
- Error handling (clear error messages)
- Logging (debugging and monitoring)

### The Solution

Processing lag tests ensure we maintain this balance:
- **We add value** through abstraction benefits
- **We minimize cost** by keeping overhead below perception thresholds
- **We prevent regressions** through automated testing

### What We Control vs. Don't Control

**We CANNOT control:**
- You.com API latency (network, server processing, data retrieval)
- User's network speed
- Geographic distance to API servers

**We CAN control:**
- Data transformation efficiency
- Validation overhead
- Response formatting cost
- Memory allocations

Processing lag tests focus exclusively on what we can control: the overhead our abstraction layer adds.

## Related Documentation

- [API Documentation](./API.md) - API reference for MCP tools
- [MCP Server Architecture](../AGENTS.md#architecture) - System overview
- [Testing Guidelines](../AGENTS.md#testing) - General testing patterns
