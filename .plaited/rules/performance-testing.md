# Performance Testing

Centralized weekly monitoring for API wrapper packages. Auto-detects regressions, files GitHub issues.

## Architecture

| Component | Path | Purpose |
|-----------|------|---------|
| Measure | scripts/performance/measure.ts | Run measurements |
| Detect | scripts/performance/detect-and-file.ts | File GitHub issues |
| Update Docs | scripts/performance/update-docs.ts | Update PERFORMANCE.md |
| Workflow | .github/workflows/weekly-performance.yml | Monday 1pm UTC |

## Commands

**Run locally:**
```bash
export YDC_API_KEY=key && bun scripts/performance/measure.ts > results.json
bun scripts/performance/detect-and-file.ts results.json  # Requires gh CLI
```
*Verify:* `cat results.json | grep -E '"pass":(true|false)'`

**Check thresholds:**
| Package | Lag | Overhead | Memory |
|---------|-----|----------|--------|
| mcp | <100ms | <50% | <400KB |
| ai-sdk-plugin | <80ms | <35% | <350KB |

*Verify:* `grep 'threshold:' scripts/performance/measure.ts`

## Add Monitoring to New Package

Only for API wrapper packages (not utils/CLI).

**Steps:**
1. Add `measureNewPackage()` to `scripts/performance/measure.ts` (see `measureMcp` pattern)
2. Add to `Promise.all([...])` in main() (line ~352)
3. Set thresholds based on complexity
4. Test: `bun scripts/performance/measure.ts`

*Verify:* `grep 'measureNewPackage' scripts/performance/measure.ts`

## When Regressions Occur

- Auto-filed as GitHub issues with severity classification
- Investigate locally: `bun --cpu-prof scripts/performance/measure.ts`

*Verify:* `gh issue list --label performance-regression`

## Resources

- Methodology: docs/PERFORMANCE.md
- Scripts: scripts/performance/
- Workflow: .github/workflows/weekly-performance.yml
