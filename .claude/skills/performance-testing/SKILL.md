---
name: performance-testing
description: Performance testing and monitoring system for dx-toolkit packages - measurements, thresholds, regression handling
---

# Performance Testing & Monitoring

Centralized performance monitoring system for dx-toolkit packages. Use these patterns when adding performance tests or investigating regressions.

---

## Centralized Performance Monitoring

This monorepo uses a centralized weekly monitoring system to track performance across all packages:

### Architecture

- **Measurements**: `scripts/performance/measure.ts` - Runs all package measurements
- **Detection**: `scripts/performance/detect-and-file.ts` - Detects regressions and creates GitHub issues
- **Documentation**: `scripts/performance/update-docs.ts` - Updates docs/PERFORMANCE.md automatically
- **Automation**: `.github/workflows/weekly-performance.yml` - Runs every Monday at 1pm UTC

### Key Benefits

- Centralized tracking across all packages
- Automated GitHub issue creation for regressions
- Public transparency (GitHub issues visible to all)
- Historical tracking (90-day artifact retention)
- No redundant test maintenance

## Running Performance Measurements

### Locally

```bash
# Set API key
export YDC_API_KEY=your-key-here

# Run measurements
bun scripts/performance/measure.ts > results.json

# View results
cat results.json

# Check for regressions (requires gh CLI)
bun scripts/performance/detect-and-file.ts results.json

# Update docs
bun scripts/performance/update-docs.ts results.json
```

### In CI

Automatically runs every Monday via weekly-performance workflow

## Package Thresholds

| Package | Lag | Overhead | Memory |
|---------|-----|----------|--------|
| `@youdotcom-oss/mcp` | < 100ms | < 50% | < 400KB |
| `@youdotcom-oss/ai-sdk-plugin` | < 80ms | < 35% | < 350KB |

See [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md) for detailed methodology and results.

## When Regressions Occur

### Automatic

1. Weekly workflow detects threshold violations
2. GitHub issue created automatically with:
   - Severity classification (minor/moderate/critical)
   - Current vs threshold comparison
   - Investigation steps
   - Links to workflow run and documentation
3. Issue updated if regression persists in subsequent runs

### Manual Investigation

```bash
# Run measurement locally
bun scripts/performance/measure.ts > results.json

# Check specific package results
cat results.json | grep -A 20 "@youdotcom-oss/mcp"

# Profile with CPU profiler
bun --cpu-prof scripts/performance/measure.ts
```

## Adding Performance Monitoring to New Packages

When creating new packages, add measurements in `scripts/performance/measure.ts`:

```typescript
const measureNewPackage = async (): Promise<PerformanceResult> => {
  const results = await measurePerformance({
    iterations: 20,
    warmup: async () => { /* ... */ },
    raw: async () => { /* Raw API call */ },
    wrapper: async () => { /* Your abstraction layer */ },
  });

  return {
    package: '@youdotcom-oss/new-package',
    timestamp: new Date().toISOString(),
    metrics: {
      processingLag: {
        value: results.processingLag,
        threshold: 80, // Set appropriate threshold
        pass: results.processingLag < 80,
      },
      // ... other metrics
    },
    rawData: { /* ... */ },
  };
};

// Add to main() Promise.all()
const results = await Promise.all([
  measureMcp(),
  measureAiSdkPlugin(),
  measureNewPackage(), // Add here
]);
```

**When to add performance monitoring:**
- Only for packages that wrap You.com APIs directly
- Not required for utility libraries, CLI tools, or packages without API wrappers
- Add measurements after initial package implementation is complete

## Best Practices

1. **Set appropriate thresholds** - Based on package complexity and API requirements
2. **Test locally first** - Before adding to CI workflow
3. **Document methodology** - Update docs/PERFORMANCE.md with measurement approach
4. **Use realistic scenarios** - Measure actual use cases, not synthetic benchmarks
5. **Monitor trends** - Look for gradual performance degradation over time

## Related Resources

- Performance documentation: `docs/PERFORMANCE.md`
- Measurement scripts: `scripts/performance/`
- Weekly workflow: `.github/workflows/weekly-performance.yml`
- Root AGENTS.md: Performance Testing section
