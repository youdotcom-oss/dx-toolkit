# Performance Testing Philosophy

This document describes the methodology and philosophy behind performance testing across all packages in the dx-toolkit monorepo.

## Overview

Processing lag tests measure the overhead introduced by our abstraction layers compared to raw You.com API calls. The goal is to quantify what processing lag our code adds while wrapping APIs.

**Important**: We cannot improve the You.com API performance itself. These tests measure **our code's overhead**, not the underlying API speed.

## Core Metrics

### Processing Lag (Absolute Time)
**Definition**: The absolute time difference between raw API calls and our abstraction layer.

- **Measured in**: milliseconds (ms)
- **Formula**: `Abstraction time - Raw API time`
- **Example**: If raw API takes 500ms and our wrapper takes 535ms, processing lag is 35ms
- **Interpretation**:
  - Negative values mean our code is faster (caching, optimizations)
  - Positive values mean our code adds overhead (validation, transformation)

### Overhead Percentage (Relative Time)
**Definition**: The relative overhead as a percentage of raw API time.

- **Measured in**: percentage (%)
- **Formula**: `(Processing lag / Raw API time) × 100`
- **Example**: 35ms lag on 500ms raw API = 7% overhead
- **Interpretation**:
  - Fast APIs (50-100ms) will show high % overhead due to fixed costs
  - Slow APIs (500ms+) will show low % overhead
  - Absolute lag (ms) is often more meaningful than relative %

### Memory Overhead (Heap Growth)
**Definition**: The heap memory growth from our abstraction layer.

- **Measured in**: kilobytes (KB)
- **Method**: Compare heap size before and after operations with forced GC
- **Includes**: Memory for data transformation, validation, schemas, buffers
- **Interpretation**: Sustained memory usage, not temporary allocations

## Methodology

### 1. Warmup Phase
**Purpose**: Eliminate cold start effects before measurements.

**Actions**:
- Run each operation once before measuring
- Ensures JIT compilation is complete
- Loads all modules into memory
- Initializes connection pools

**Why**: First-run operations are 2-10x slower due to:
- JIT compilation
- Module loading
- DNS resolution
- TLS handshake establishment

### 2. Measurement Phase
**Purpose**: Collect statistically reliable timing data.

**Process**:
```typescript
for (let i = 0; i < iterations; i++) {
  // Raw API call (baseline)
  const rawStart = performance.now();
  await rawApiCall();
  const rawTime = performance.now() - rawStart;

  // Abstraction layer call (with overhead)
  const wrapperStart = performance.now();
  await wrapperCall();
  const wrapperTime = performance.now() - wrapperStart;
}

// Calculate averages
const avgRaw = average(rawTimes);
const avgWrapper = average(wrapperTimes);
const processingLag = avgWrapper - avgRaw;
```

**Iterations**:
- **Fast operations** (< 200ms): 10 iterations
- **Slow operations** (> 500ms): 5 iterations
- **Reason**: More iterations smooth out network variability

**Timing Tool**: `performance.now()` provides microsecond precision

### 3. Memory Measurement
**Purpose**: Track sustained heap growth from abstraction overhead.

**Process**:
```typescript
// Force GC and wait for stabilization
Bun.gc(true);
await new Promise(resolve => setTimeout(resolve, 100));

const heapBefore = heapStats().heapSize;

// Run operations
for (let i = 0; i < iterations; i++) {
  await operation();
}

// Force GC again
Bun.gc(true);
await new Promise(resolve => setTimeout(resolve, 100));

const heapAfter = heapStats().heapSize;
const heapGrowth = heapAfter - heapBefore;
```

**Why Force GC**: Ensures we measure sustained memory, not temporary allocations.

## Interpreting Results

### Good Results
```
Processing lag: 15ms
Overhead: 3%
Memory: 50KB
```
✅ Minimal overhead, efficient implementation

### Acceptable Results
```
Processing lag: 80ms
Overhead: 40%
Memory: 350KB
```
✅ Within thresholds, acceptable for complex abstractions

### Warning Signs
```
Processing lag: 150ms
Overhead: 75%
Memory: 500KB
```
⚠️ Investigate potential optimizations

### Critical Issues
```
Processing lag: 500ms
Overhead: 200%
Memory: 2MB
```
🚨 Significant overhead requiring immediate investigation

## Threshold Setting Guidelines

Each package should set thresholds based on its architecture. Different package types have different overhead characteristics:

### Threshold Guidelines by Package Type

| Package Type | Lag Threshold | Overhead Threshold | Memory Threshold | Rationale |
|--------------|---------------|-------------------|------------------|-----------|
| **Thin library wrappers** | < 50ms | < 10% | < 300KB | Minimal transformation, no transport overhead |
| **SDK integrations** | < 80ms | < 35% | < 350KB | Moderate data transformation and validation |
| **MCP servers** | < 100ms | < 50% | < 400KB | Includes stdio/JSON-RPC transport + protocol overhead |
| **Complex frameworks** | < 150ms | < 75% | < 500KB | Multiple abstraction layers, state management |

### Why MCP Servers Have Higher Thresholds

MCP servers (like `@youdotcom-oss/mcp`) have higher thresholds (100ms/50%/400KB) compared to library packages (50ms/10%/300KB) because of architectural differences:

**MCP Server Overhead Sources**:
- **Stdio transport**: Process IPC adds 20-40ms latency
- **JSON-RPC protocol**: Serialization/deserialization adds 10-20ms
- **Client SDK**: `@modelcontextprotocol/sdk` protocol overhead
- **Process spawning**: Each test spawns MCP server as subprocess
- **State management**: Client state, connection pools, schemas

**Library Package Overhead Sources**:
- **Data transformation**: Converting between formats
- **Validation**: Zod schema validation (5-15ms)
- **Error handling**: Try/catch and error formatting

**Example Comparison**:
```typescript
// Library wrapper (50ms threshold)
export const callApi = async (params) => {
  // Just validation + fetch + transform
  const validated = schema.parse(params);  // 5ms
  const response = await fetch(url, validated);  // API time (not counted)
  return transform(response);  // 10ms
  // Total overhead: ~15ms
};

// MCP server (100ms threshold)
const result = await client.callTool({ name: 'api', arguments: params });
// Overhead includes:
// - Stdio IPC: 30ms
// - JSON-RPC: 15ms
// - Validation: 5ms
// - Transform: 10ms
// - Client SDK: 20ms
// Total overhead: ~80ms
```

### Fixed vs Proportional Overhead
- **Fixed overhead**: Serialization, validation, setup (same regardless of data size)
- **Proportional overhead**: Data transformation, parsing (grows with data size)
- **Note**: Fixed overhead shows high % on fast operations

### Perception Thresholds
- **Imperceptible**: < 50ms
- **Perceivable**: 50-150ms
- **Noticeable**: 150-300ms
- **Annoying**: > 300ms

Aim for thresholds that keep total lag below perception thresholds.

<!-- BEGIN AUTO-GENERATED RESULTS -->
## Latest Test Results

**Last Updated**: 2025-12-29T13:14:05.470Z
**Workflow Run**: [View Results](https://github.com/youdotcom-oss/dx-toolkit/actions/runs/20573719868)

| Package | Processing Lag | Overhead % | Memory | Status |
|---------|---------------|------------|--------|--------|
| @youdotcom-oss/mcp | ✅ 2.35ms (< 100.00ms) | ✅ 4.36% (< 50.00%) | ✅ 53.52KB (< 400.00KB) | ✅ Pass |
| @youdotcom-oss/ai-sdk-plugin | ✅ -3.87ms (< 80.00ms) | ✅ -6.59% (< 35.00%) | ✅ 205.34KB (< 350.00KB) | ✅ Pass |

<details>
<summary>View detailed metrics</summary>


### @youdotcom-oss/mcp

**Timestamp**: 2025-12-29T13:14:05.416Z

**Processing Lag**:
- Raw API avg: 53.91ms
- Wrapper avg: 56.27ms
- Processing lag: 2.35ms
- Threshold: < 100.00ms
- Status: ✅ Pass

**Overhead**:
- Percentage: 4.36%
- Threshold: < 50.00%
- Status: ✅ Pass

**Memory**:
- Heap before: 10864.82KB
- Heap after: 10918.34KB
- Growth: 53.52KB
- Threshold: < 400.00KB
- Status: ✅ Pass

**Test Configuration**:
- Iterations: 20


### @youdotcom-oss/ai-sdk-plugin

**Timestamp**: 2025-12-29T13:14:02.620Z

**Processing Lag**:
- Raw API avg: 58.73ms
- Wrapper avg: 54.86ms
- Processing lag: -3.87ms
- Threshold: < 80.00ms
- Status: ✅ Pass

**Overhead**:
- Percentage: -6.59%
- Threshold: < 35.00%
- Status: ✅ Pass

**Memory**:
- Heap before: 11097.44KB
- Heap after: 11302.77KB
- Growth: 205.34KB
- Threshold: < 350.00KB
- Status: ✅ Pass

**Test Configuration**:
- Iterations: 20

</details>
<!-- END AUTO-GENERATED RESULTS -->

## Running Performance Measurements

To measure performance for all packages manually:

```bash
# From repository root
bun scripts/performance/measure.ts > results.json
```

This measures all packages in a single run and outputs results as JSON. The weekly workflow uses this same script.

## Package Performance Thresholds

### @youdotcom-oss/mcp
- **Processing lag**: < 100ms
- **Overhead percentage**: < 50%
- **Memory overhead**: < 400KB

### @youdotcom-oss/ai-sdk-plugin
- **Processing lag**: < 80ms
- **Overhead percentage**: < 35%
- **Memory overhead**: < 350KB

## Common Troubleshooting

### High Processing Lag

**Symptoms**: Consistently exceeds threshold by 2x or more

**Common Causes**:
- Unnecessary data transformations
- Redundant validation passes
- Inefficient serialization
- Synchronous blocking operations
- N+1 query patterns

**Debug Approach**:
```bash
# Profile with CPU profiler
bun --cpu-prof test src/tests/processing-lag.spec.ts

# Identify hotspots in generated .cpuprofile file
```

### High Memory Overhead

**Symptoms**: Heap growth exceeds threshold

**Common Causes**:
- Large schema objects not being reused
- Response data not being garbage collected
- Caching without bounds
- Circular references preventing GC
- Memory leaks in event listeners

**Debug Approach**:
```bash
# Profile with heap profiler
bun --heap-prof test src/tests/processing-lag.spec.ts

# Analyze .heapprofile for large objects
```

### Inconsistent Results

**Symptoms**: Large variance between test runs (±50% or more)

**Common Causes**:
- Network variability (use stable connection)
- System load (close other applications)
- Insufficient iterations (increase iteration count)
- Skipped warmup phase
- Background processes interfering

**Solutions**:
- Run tests on stable network without VPN
- Close resource-intensive applications
- Increase iterations (10 → 20 or 5 → 10)
- Verify warmup phase executes
- Run multiple times and compare results

### Test Timeouts

**Symptoms**: Tests fail with timeout errors

**Common Causes**:
- AI processing APIs (Express agent)
- Rate limiting from too many requests
- Network latency spikes
- Insufficient timeout configuration

**Solutions**:
```typescript
test.serial('Slow operation', async () => {
  // test body
}, { timeout: 60000 }); // 60s timeout
```

## When to Add Performance Tests

Add processing lag tests to packages that:

✅ **Wrap You.com APIs** - Quantify abstraction overhead
✅ **Provide SDK interfaces** - Track integration costs
✅ **Transform data** - Measure transformation overhead
✅ **Add middleware layers** - Quantify middleware costs

Skip processing lag tests for packages that:

❌ **Pure utilities** - No API wrapping
❌ **CLI tools** - User interaction dominates timing
❌ **Documentation** - No runtime code
❌ **Configuration** - Static data only

## Best Practices

### Test Design
- Always include warmup phase
- Use serial execution for consistency (`test.serial()`)
- Run multiple iterations to smooth variance
- Measure both time and memory
- Add delays between iterations for rate limiting

### Threshold Setting
- Start conservative, adjust based on empirical data
- Document rationale for each threshold
- Review thresholds quarterly
- Update when architecture changes significantly

### Maintenance
- Run tests in CI on every PR
- Alert on threshold violations
- Review failures as optimization opportunities
- Keep tests updated with API changes

## Further Reading

For general development guidelines, see:
- [Contributing Guide](../CONTRIBUTING.md)
- [Development Guide](../AGENTS.md)
- [MCP Server API](../packages/mcp/docs/API.md)
- [AI SDK Plugin API](../packages/ai-sdk-plugin/docs/API.md)
