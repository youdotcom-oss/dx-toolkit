#!/usr/bin/env bun

/**
 * Documentation Update Script
 *
 * Updates docs/PERFORMANCE.md with latest performance results
 * using markdown markers to identify the replacement section.
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

/**
 * Format metric value with status indicator
 */
const formatMetric = (metric: MetricResult, unit: string): string => {
  const status = metric.pass ? '✅' : '⚠️';
  const formattedValue = unit === 'KB' ? (metric.value / 1024).toFixed(2) : metric.value.toFixed(2);
  const thresholdValue = unit === 'KB' ? (metric.threshold / 1024).toFixed(2) : metric.threshold.toFixed(2);
  return `${status} ${formattedValue}${unit} (< ${thresholdValue}${unit})`;
};

/**
 * Generate results table
 */
const generateResultsTable = (results: PerformanceResult[], workflowUrl: string): string => {
  const timestamp = new Date().toISOString();

  // Main table rows
  const tableRows = results
    .map((result) => {
      const allPass = Object.values(result.metrics).every((m) => m.pass);
      const status = allPass ? '✅ Pass' : '❌ Fail';

      const lagMetric = formatMetric(result.metrics.processingLag, 'ms');
      const overheadMetric = formatMetric(result.metrics.overheadPercent, '%');
      const memoryMetric = formatMetric(result.metrics.memoryOverhead, 'KB');

      return `| ${result.package} | ${lagMetric} | ${overheadMetric} | ${memoryMetric} | ${status} |`;
    })
    .join('\n');

  // Detailed metrics sections
  const detailedSections = results
    .map(
      (result) => `
### ${result.package}

**Timestamp**: ${result.timestamp}

**Processing Lag**:
- Raw API avg: ${result.rawData.avgRawTime.toFixed(2)}ms
- Wrapper avg: ${result.rawData.avgWrapperTime.toFixed(2)}ms
- Processing lag: ${result.metrics.processingLag.value.toFixed(2)}ms
- Threshold: < ${result.metrics.processingLag.threshold.toFixed(2)}ms
- Status: ${result.metrics.processingLag.pass ? '✅ Pass' : '❌ Fail'}

**Overhead**:
- Percentage: ${result.metrics.overheadPercent.value.toFixed(2)}%
- Threshold: < ${result.metrics.overheadPercent.threshold.toFixed(2)}%
- Status: ${result.metrics.overheadPercent.pass ? '✅ Pass' : '❌ Fail'}

**Memory**:
- Heap before: ${(result.rawData.heapBefore / 1024).toFixed(2)}KB
- Heap after: ${(result.rawData.heapAfter / 1024).toFixed(2)}KB
- Growth: ${(result.metrics.memoryOverhead.value / 1024).toFixed(2)}KB
- Threshold: < ${(result.metrics.memoryOverhead.threshold / 1024).toFixed(2)}KB
- Status: ${result.metrics.memoryOverhead.pass ? '✅ Pass' : '❌ Fail'}

**Test Configuration**:
- Iterations: ${result.rawData.iterations}
`,
    )
    .join('\n');

  return `## Latest Test Results

**Last Updated**: ${timestamp}
**Workflow Run**: [View Results](${workflowUrl})

| Package | Processing Lag | Overhead % | Memory | Status |
|---------|---------------|------------|--------|--------|
${tableRows}

<details>
<summary>View detailed metrics</summary>

${detailedSections}
</details>`;
};

/**
 * Update PERFORMANCE.md with new results
 */
const updatePerformanceDocs = async (results: PerformanceResult[], workflowUrl: string): Promise<void> => {
  const perfDocPath = 'docs/PERFORMANCE.md';

  // Read current PERFORMANCE.md
  const perfDoc = await Bun.file(perfDocPath).text();

  // Generate new results section
  const newSection = generateResultsTable(results, workflowUrl);

  // Define markers
  const startMarker = '<!-- BEGIN AUTO-GENERATED RESULTS -->';
  const endMarker = '<!-- END AUTO-GENERATED RESULTS -->';

  // Check if markers exist
  if (!perfDoc.includes(startMarker) || !perfDoc.includes(endMarker)) {
    throw new Error(`Markers not found in ${perfDocPath}. Please add:\n${startMarker}\n${endMarker}`);
  }

  // Replace content between markers
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'm');
  const updated = perfDoc.replace(regex, `${startMarker}\n${newSection}\n${endMarker}`);

  // Write updated file
  await Bun.write(perfDocPath, updated);

  console.error('✅ Updated docs/PERFORMANCE.md');
};

// Main execution
const main = async () => {
  const resultsFile = process.argv[2];

  if (!resultsFile) {
    console.error('Error: Results file path required');
    console.error('Usage: bun update-docs.ts <results.json>');
    process.exit(1);
  }

  console.error('=== Documentation Update Script ===');
  console.error(`Reading results from: ${resultsFile}\n`);

  try {
    const results: PerformanceResult[] = JSON.parse(await Bun.file(resultsFile).text());

    const workflowUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : 'https://github.com/youdotcom-oss/dx-toolkit/actions';

    await updatePerformanceDocs(results, workflowUrl);

    // Check if any metrics failed
    const anyFailed = results.some((r) => Object.values(r.metrics).some((m) => !m.pass));

    if (anyFailed) {
      console.error('\n⚠️  Some performance thresholds were exceeded');
      console.error('    (Documentation updated, but regressions detected)');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n=== Update Failed ===');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

main();
