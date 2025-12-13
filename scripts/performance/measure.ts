#!/usr/bin/env bun

import { heapStats } from 'bun:jsc';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { SEARCH_API_URL } from '@youdotcom-oss/mcp';
import { $ } from 'bun';

/**
 * Performance Measurement Script
 *
 * Centralized performance monitoring for all packages.
 * Measures processing lag, overhead percentage, and memory overhead.
 * Outputs JSON to stdout for consumption by other scripts.
 */

const YDC_API_KEY = process.env.YDC_API_KEY ?? '';

if (!YDC_API_KEY) {
  console.error('Error: YDC_API_KEY environment variable is required');
  process.exit(1);
}

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
 * Calculate statistics and remove outliers (> 2 standard deviations)
 * Improves reliability by filtering network anomalies
 */
const calculateStats = (times: number[]) => {
  const avg = times.reduce((a, b) => a + b) / times.length;
  const stdDev = Math.sqrt(times.reduce((sum, time) => sum + (time - avg) ** 2, 0) / times.length);

  // Remove outliers (> 2 standard deviations from mean)
  const filtered = times.filter((t) => Math.abs(t - avg) <= 2 * stdDev);

  return {
    avg: filtered.length > 0 ? filtered.reduce((a, b) => a + b) / filtered.length : avg,
    outliers: times.length - filtered.length,
  };
};

/**
 * Core measurement function
 * Measures processing lag and memory overhead for any operation pair
 */
const measurePerformance = async (config: {
  iterations: number;
  warmup: () => Promise<void>;
  raw: () => Promise<void>;
  wrapper: () => Promise<void>;
  sleepMs?: number;
}) => {
  // Warmup phase
  await config.warmup();

  const rawTimes: number[] = [];
  const wrapperTimes: number[] = [];

  // Measure processing lag
  for (let i = 0; i < config.iterations; i++) {
    // Raw call (baseline)
    const rawStart = performance.now();
    await config.raw();
    rawTimes.push(performance.now() - rawStart);

    // Wrapper call (with overhead)
    const wrapperStart = performance.now();
    await config.wrapper();
    wrapperTimes.push(performance.now() - wrapperStart);

    // Delay between iterations to avoid rate limiting
    await Bun.sleep(config.sleepMs ?? 100);
  }

  // Calculate statistics with outlier detection
  const rawStats = calculateStats(rawTimes);
  const wrapperStats = calculateStats(wrapperTimes);

  // Measure memory (fewer iterations for stability)
  Bun.gc(true);
  await Bun.sleep(100);
  const heapBefore = heapStats().heapSize;

  for (let i = 0; i < 5; i++) {
    await config.wrapper();
  }

  Bun.gc(true);
  await Bun.sleep(100);
  const heapAfter = heapStats().heapSize;

  return {
    avgRawTime: rawStats.avg,
    avgWrapperTime: wrapperStats.avg,
    processingLag: wrapperStats.avg - rawStats.avg,
    overheadPercent: ((wrapperStats.avg - rawStats.avg) / rawStats.avg) * 100,
    heapBefore,
    heapAfter,
    memoryOverhead: heapAfter - heapBefore,
    outliersRaw: rawStats.outliers,
    outliersWrapper: wrapperStats.outliers,
  };
};

/**
 * Retry wrapper for measurements
 * Retries up to 2 times if any metric fails threshold
 */
const measureWithRetry = async (measureFn: () => Promise<PerformanceResult>): Promise<PerformanceResult> => {
  const maxAttempts = 3;
  let lastResult: PerformanceResult;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await measureFn();

    // Check if all metrics passed
    const allPassed = Object.values(lastResult.metrics).every((m) => m.pass);

    if (allPassed) {
      if (attempt > 1) {
        console.error(`✅ All metrics passed on attempt ${attempt}`);
      }
      return lastResult;
    }

    // Log failed metrics
    const failedMetrics = Object.entries(lastResult.metrics)
      .filter(([_, m]) => !m.pass)
      .map(([name, m]) => `${name}: ${m.value.toFixed(2)} (threshold: ${m.threshold})`);

    if (attempt < maxAttempts) {
      console.error(`\n⚠️  Attempt ${attempt}/${maxAttempts} - Metrics exceeded threshold:`);
      console.error(`   ${failedMetrics.join(', ')}`);
      console.error('   Retrying measurement...\n');
      await Bun.sleep(2000); // Wait 2s before retry
    } else {
      console.error(`\n❌ All ${maxAttempts} attempts failed - Metrics still exceed threshold:`);
      console.error(`   ${failedMetrics.join(', ')}`);
    }
  }

  return lastResult;
};

/**
 * Measure MCP package performance
 * Thresholds: 100ms lag, 50% overhead, 400KB memory
 */
const measureMcp = async (): Promise<PerformanceResult> => {
  console.error('\n=== Measuring @youdotcom-oss/mcp ===');

  // Build MCP server
  console.error('Building MCP server...');
  const buildResult = await $`bun run build`.cwd('packages/mcp').quiet();
  if (buildResult.exitCode !== 0) {
    throw new Error(`MCP build failed: ${buildResult.stderr}`);
  }

  const stdioPath = Bun.resolveSync('../../packages/mcp/bin/stdio', import.meta.dir);
  const USER_AGENT = 'MCP/measurement (You.com; performance-monitoring)';

  // Create client for measurements
  const transport = new StdioClientTransport({
    command: 'npx',
    args: [stdioPath],
    env: { YDC_API_KEY },
  });

  const client = new Client({
    name: 'measurement-client',
    version: '1.0.0',
  });

  await client.connect(transport);

  // Warmup
  console.error('Running warmup...');
  for (let i = 0; i < 3; i++) {
    await client.callTool({
      name: 'you-search',
      arguments: { query: 'warmup', count: 2 },
    });
  }

  // Measure Search API
  console.error('Measuring Search API (20 iterations)...');
  const searchResults = await measurePerformance({
    iterations: 20,
    warmup: async () => {
      // Already warmed up above
    },
    raw: async () => {
      const rawUrl = new URL(SEARCH_API_URL);
      rawUrl.searchParams.append('query', 'javascript tutorial');
      rawUrl.searchParams.append('count', '3');
      await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': YDC_API_KEY,
          'User-Agent': USER_AGENT,
        },
      });
    },
    wrapper: async () => {
      await client.callTool({
        name: 'you-search',
        arguments: { query: 'javascript tutorial', count: 3 },
      });
    },
    sleepMs: 100,
  });

  await client.close();

  console.error(
    `Search: ${searchResults.processingLag.toFixed(2)}ms lag, ${searchResults.overheadPercent.toFixed(2)}% overhead`,
  );

  return {
    package: '@youdotcom-oss/mcp',
    timestamp: new Date().toISOString(),
    metrics: {
      processingLag: {
        value: searchResults.processingLag,
        threshold: 100,
        pass: searchResults.processingLag < 100,
      },
      overheadPercent: {
        value: searchResults.overheadPercent,
        threshold: 50,
        pass: searchResults.overheadPercent < 50,
      },
      memoryOverhead: {
        value: searchResults.memoryOverhead,
        threshold: 400 * 1024, // 400KB in bytes
        pass: searchResults.memoryOverhead < 400 * 1024,
      },
    },
    rawData: {
      iterations: 20,
      avgRawTime: searchResults.avgRawTime,
      avgWrapperTime: searchResults.avgWrapperTime,
      heapBefore: searchResults.heapBefore,
      heapAfter: searchResults.heapAfter,
    },
  };
};

/**
 * Measure AI SDK Plugin package performance
 * Thresholds: 80ms lag, 35% overhead, 350KB memory
 */
const measureAiSdkPlugin = async (): Promise<PerformanceResult> => {
  console.error('\n=== Measuring @youdotcom-oss/ai-sdk-plugin ===');

  const USER_AGENT = 'AI-SDK/measurement (You.com; performance-monitoring)';

  // Warmup
  console.error('Running warmup...');
  const searchTool = youSearch({ apiKey: YDC_API_KEY });
  await searchTool.execute?.({ query: 'warmup', count: 1 }, { toolCallId: 'warmup', messages: [] });

  // Measure Search API
  console.error('Measuring Search API (20 iterations)...');
  const searchResults = await measurePerformance({
    iterations: 20,
    warmup: async () => {
      // Already warmed up above
    },
    raw: async () => {
      const rawUrl = new URL(SEARCH_API_URL);
      rawUrl.searchParams.append('query', 'javascript tutorial');
      rawUrl.searchParams.append('count', '3');
      await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': YDC_API_KEY,
          'User-Agent': USER_AGENT,
        },
      });
    },
    wrapper: async () => {
      await searchTool.execute?.({ query: 'javascript tutorial', count: 3 }, { toolCallId: 'test', messages: [] });
    },
    sleepMs: 100,
  });

  console.error(
    `Search: ${searchResults.processingLag.toFixed(2)}ms lag, ${searchResults.overheadPercent.toFixed(2)}% overhead`,
  );

  return {
    package: '@youdotcom-oss/ai-sdk-plugin',
    timestamp: new Date().toISOString(),
    metrics: {
      processingLag: {
        value: searchResults.processingLag,
        threshold: 80,
        pass: searchResults.processingLag < 80,
      },
      overheadPercent: {
        value: searchResults.overheadPercent,
        threshold: 35,
        pass: searchResults.overheadPercent < 35,
      },
      memoryOverhead: {
        value: searchResults.memoryOverhead,
        threshold: 350 * 1024, // 350KB in bytes
        pass: searchResults.memoryOverhead < 350 * 1024,
      },
    },
    rawData: {
      iterations: 20,
      avgRawTime: searchResults.avgRawTime,
      avgWrapperTime: searchResults.avgWrapperTime,
      heapBefore: searchResults.heapBefore,
      heapAfter: searchResults.heapAfter,
    },
  };
};

// Main execution
const main = async () => {
  console.error('=== Performance Measurement Script ===');
  console.error('Measuring performance for all packages...\n');

  try {
    const results = await Promise.all([measureWithRetry(measureMcp), measureWithRetry(measureAiSdkPlugin)]);

    console.error('\n=== Measurement Complete ===');
    console.error('Outputting results as JSON...\n');

    // Output results as JSON to stdout (other output goes to stderr)
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('\n=== Measurement Failed ===');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

main();
