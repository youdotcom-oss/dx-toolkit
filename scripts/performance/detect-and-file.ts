#!/usr/bin/env bun

import { $ } from 'bun';

/**
 * Regression Detection and GitHub Issue Creation
 *
 * Reads performance results from JSON file, detects regressions,
 * and creates/updates GitHub issues using the gh CLI.
 */

// Type definitions (inline)
type MetricResult = {
  value: number;
  threshold: number;
  pass: boolean;
};

type PerformanceResult = {
  package: string;
  timestamp: string;
  metrics: {
    processingLag: MetricResult;
    overheadPercent: MetricResult;
    memoryOverhead: MetricResult;
  };
  rawData: {
    iterations: number;
    avgRawTime: number;
    avgWrapperTime: number;
    heapBefore: number;
    heapAfter: number;
  };
};

type Regression = {
  package: string;
  metric: 'processingLag' | 'overheadPercent' | 'memoryOverhead';
  current: number;
  threshold: number;
  exceedsBy: number;
  exceedsByPercent: number;
  severity: 'minor' | 'moderate' | 'critical';
  timestamp: string;
};

const METRIC_LABELS = {
  processingLag: 'Processing Lag',
  overheadPercent: 'Overhead Percentage',
  memoryOverhead: 'Memory Overhead',
} as const;

/**
 * Calculate severity based on how much threshold is exceeded
 */
const calculateSeverity = (exceedsByPercent: number): Regression['severity'] => {
  if (exceedsByPercent > 50) return 'critical'; // >50% over threshold
  if (exceedsByPercent > 25) return 'moderate'; // 25-50% over threshold
  return 'minor'; // <25% over threshold
};

/**
 * Detect regressions from performance results
 */
const detectRegressions = (results: PerformanceResult[]): Regression[] => {
  const regressions: Regression[] = [];

  for (const result of results) {
    for (const [metricName, metricData] of Object.entries(result.metrics)) {
      if (!metricData.pass) {
        const exceedsBy = metricData.value - metricData.threshold;
        const exceedsByPercent = (exceedsBy / metricData.threshold) * 100;

        regressions.push({
          package: result.package,
          metric: metricName as keyof typeof METRIC_LABELS,
          current: metricData.value,
          threshold: metricData.threshold,
          exceedsBy,
          exceedsByPercent,
          severity: calculateSeverity(exceedsByPercent),
          timestamp: result.timestamp,
        });
      }
    }
  }

  return regressions;
};

/**
 * Format metric value with appropriate units
 */
const formatMetricValue = (metric: Regression['metric'], value: number): string => {
  switch (metric) {
    case 'processingLag':
      return `${value.toFixed(2)}ms`;
    case 'overheadPercent':
      return `${value.toFixed(2)}%`;
    case 'memoryOverhead':
      return `${(value / 1024).toFixed(2)}KB`;
  }
};

/**
 * Generate GitHub issue title
 */
const generateIssueTitle = (regression: Regression): string => {
  const severity = regression.severity.toUpperCase();
  const metric = METRIC_LABELS[regression.metric];
  return `[${severity}] Performance Regression: ${regression.package} - ${metric}`;
};

/**
 * Generate GitHub issue body
 */
const generateIssueBody = (regression: Regression, workflowUrl: string, perfDocUrl: string): string => {
  const metricLabel = METRIC_LABELS[regression.metric];
  const currentValue = formatMetricValue(regression.metric, regression.current);
  const thresholdValue = formatMetricValue(regression.metric, regression.threshold);
  const exceedsValue = formatMetricValue(regression.metric, regression.exceedsBy);

  return `# Performance Regression Detected

## Summary

The **${metricLabel}** for \`${regression.package}\` has exceeded the established threshold.

## Metrics

| Metric | Current | Threshold | Exceeds By | Severity |
|--------|---------|-----------|------------|----------|
| ${metricLabel} | **${currentValue}** | ${thresholdValue} | +${exceedsValue} (+${regression.exceedsByPercent.toFixed(1)}%) | ${regression.severity.toUpperCase()} |

## Details

- **Package**: \`${regression.package}\`
- **Metric**: ${metricLabel}
- **Current Value**: ${currentValue}
- **Threshold**: ${thresholdValue}
- **Exceeds By**: +${exceedsValue} (+${regression.exceedsByPercent.toFixed(1)}%)
- **Severity**: ${regression.severity.toUpperCase()}
- **Detected**: ${new Date(regression.timestamp).toLocaleString()}

## Investigation Steps

1. **Review recent changes**
   - Check commits since last passing measurement
   - Look for changes in \`${regression.package}\` or dependencies
   - Review PRs merged in past week

2. **Analyze performance data**
   - View detailed metrics: [PERFORMANCE.md](${perfDocUrl})
   - Check workflow logs: [View Run](${workflowUrl})
   - Compare with historical trends

3. **Reproduce locally**
   \`\`\`bash
   bun scripts/performance/measure.ts > results.json
   cat results.json | grep -A 20 "${regression.package}"
   \`\`\`

4. **Profile the code**
   \`\`\`bash
   # Run with CPU profiler
   bun --cpu-prof scripts/performance/measure.ts
   # Analyze .cpuprofile for hotspots
   \`\`\`

## Severity Classification

${
  regression.severity === 'critical'
    ? '**🚨 CRITICAL**: Performance degraded by >50%. Immediate investigation required.'
    : regression.severity === 'moderate'
      ? '**⚠️ MODERATE**: Performance degraded by 25-50%. Should be addressed soon.'
      : '**ℹ️ MINOR**: Performance degraded by <25%. Monitor for trends.'
}

## Resolution Criteria

This issue can be closed when:
- [ ] Weekly performance measurement shows metric back within threshold
- [ ] Root cause identified and documented in comments
- [ ] Fix implemented and verified in local measurements

## References

- [PERFORMANCE.md](${perfDocUrl})
- [Workflow Run](${workflowUrl})
- [Performance Testing Guide](https://github.com/youdotcom-oss/dx-toolkit/blob/main/docs/PERFORMANCE.md)

---

*This issue was automatically generated by the weekly performance monitoring workflow.*`;
};

/**
 * Create or update GitHub issue for regression
 */
const createGitHubIssue = async (regression: Regression, workflowUrl: string): Promise<string | null> => {
  const perfDocUrl = 'https://github.com/youdotcom-oss/dx-toolkit/blob/main/docs/PERFORMANCE.md';
  const title = generateIssueTitle(regression);
  const body = generateIssueBody(regression, workflowUrl, perfDocUrl);

  try {
    // Check for existing open issues with same title
    const searchResult = await $`gh issue list --state open --search ${title} --json number,url`.json();

    if (Array.isArray(searchResult) && searchResult.length > 0) {
      // Update existing issue
      const existingIssue = searchResult[0];
      const updateComment = `## Updated Measurement (${new Date(regression.timestamp).toLocaleString()})

Still exceeding threshold:
- Current: ${formatMetricValue(regression.metric, regression.current)}
- Threshold: ${formatMetricValue(regression.metric, regression.threshold)}
- Exceeds by: +${formatMetricValue(regression.metric, regression.exceedsBy)} (+${regression.exceedsByPercent.toFixed(1)}%)

[View latest workflow](${workflowUrl})`;

      await $`gh issue comment ${existingIssue.number} --body ${updateComment}`;
      console.error(`Updated existing issue: ${existingIssue.url}`);
      return existingIssue.url;
    }

    // Create new issue
    const labels = ['performance', 'regression', `severity:${regression.severity}`];
    const result =
      await $`gh issue create --title ${title} --body ${body} --label ${labels.join(',')} --json url`.json();

    console.error(`Created new issue: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(`Failed to create/update issue: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

// Main execution
const main = async () => {
  const resultsFile = process.argv[2];

  if (!resultsFile) {
    console.error('Error: Results file path required');
    console.error('Usage: bun detect-and-file.ts <results.json>');
    process.exit(1);
  }

  console.error('=== Regression Detection Script ===');
  console.error(`Reading results from: ${resultsFile}\n`);

  try {
    const results: PerformanceResult[] = JSON.parse(await Bun.file(resultsFile).text());
    const regressions = detectRegressions(results);

    if (regressions.length === 0) {
      console.error('✅ No performance regressions detected');
      process.exit(0);
    }

    console.error(`\n⚠️  Detected ${regressions.length} performance regression(s):\n`);

    const workflowUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : 'https://github.com/youdotcom-oss/dx-toolkit/actions';

    const createdIssues: string[] = [];

    for (const regression of regressions) {
      console.error(
        `- ${regression.package}: ${regression.metric} exceeds threshold by ${regression.exceedsByPercent.toFixed(1)}% (${regression.severity})`,
      );

      const issueUrl = await createGitHubIssue(regression, workflowUrl);

      if (issueUrl) {
        createdIssues.push(issueUrl);
      }
    }

    if (createdIssues.length > 0) {
      console.error('\n📋 Issues created/updated:');
      for (const url of createdIssues) {
        console.error(`   ${url}`);
      }
    }

    // Don't fail workflow - issues are created but we still want docs updated
    process.exit(0);
  } catch (error) {
    console.error('\n=== Detection Failed ===');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

main();
