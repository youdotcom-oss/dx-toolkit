import { heapStats } from 'bun:jsc';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { $ } from 'bun';
import packageJson from '../../package.json' with { type: 'json' };
import { CONTENTS_API_URL, EXPRESS_API_URL, SEARCH_API_URL } from '../shared/api-constants.ts';

/**
 * Processing Lag Test Suite
 *
 * Measures the overhead introduced by our MCP abstraction layers compared to raw API calls.
 * We can't improve the You.com API performance itself, but we need to quantify what
 * processing lag our code adds.
 *
 * Metrics:
 * - Processing lag (absolute time difference)
 * - Overhead percentage (relative overhead)
 * - Memory overhead (heap growth)
 *
 * Thresholds (adjusted for MCP stdio/JSON-RPC overhead):
 * - < 100ms absolute processing lag
 * - < 50% relative overhead (allows for fast APIs where MCP overhead is fixed)
 * - < 400KB memory overhead (MCP server maintains state, schemas, buffers)
 */

let client: Client;

const YDC_API_KEY = process.env.YDC_API_KEY ?? '';

// User-Agent matching MCP server format: MCP/{version} (You.com; {client})
const USER_AGENT = `MCP/${packageJson.version} (You.com; processing-lag-test)`;

/**
 * Calculate statistics and remove outliers (> 2 standard deviations)
 * Improves test reliability by filtering network anomalies
 */
const calculateStats = (times: number[]) => {
  const avg = times.reduce((a, b) => a + b) / times.length;
  const stdDev = Math.sqrt(times.reduce((sum, time) => sum + (time - avg) ** 2, 0) / times.length);

  // Remove outliers (> 2 standard deviations from mean)
  const filtered = times.filter((t) => Math.abs(t - avg) <= 2 * stdDev);

  return {
    avg: filtered.length > 0 ? filtered.reduce((a, b) => a + b) / filtered.length : avg,
    stdDev,
    outliers: times.length - filtered.length,
    filtered,
  };
};

beforeAll(async () => {
  console.log('\n=== Warming up: Building and starting MCP server ===');

  // Build MCP server with error handling
  const buildResult = await $`bun run build`.quiet();
  if (buildResult.exitCode !== 0) {
    throw new Error(`Build failed. Run 'bun run build' manually to see errors.\n${buildResult.stderr}`);
  }

  // Resolve stdio path (Bun.resolveSync throws if file not found)
  let stdioPath: string;
  try {
    stdioPath = Bun.resolveSync('../../bin/stdio', import.meta.dir);
  } catch (_err) {
    throw new Error(`stdio.js not found. Build may have failed silently. Run 'bun run build' and check for errors.`);
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: [stdioPath],
    env: {
      YDC_API_KEY,
    },
  });

  client = new Client({
    name: 'processing-lag-test-client',
    version: '0.0.1',
  });

  await client.connect(transport);

  // Warmup: run each tool once to eliminate cold start effects
  console.log('Running warmup calls to eliminate cold start effects...');

  await client.callTool({
    name: 'you-search',
    arguments: { query: 'warmup', count: 1 },
  });

  await client.callTool({
    name: 'you-express',
    arguments: { input: 'warmup' },
  });

  await client.callTool({
    name: 'you-contents',
    arguments: { urls: ['https://example.com'], format: 'markdown' },
  });

  console.log('Warmup complete. Starting measurements...\n');
});

afterAll(async () => {
  await client.close();
});

describe('Processing Lag: MCP Server vs Raw API Calls', () => {
  const iterations = 10;

  test.serial(
    'Search API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const mcpTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
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
        rawTimes.push(performance.now() - rawStart);

        // MCP tool call (with abstraction overhead)
        const mcpStart = performance.now();
        await client.callTool({
          name: 'you-search',
          arguments: {
            query: 'javascript tutorial',
            count: 3,
          },
        });
        mcpTimes.push(performance.now() - mcpStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const mcpStats = calculateStats(mcpTimes);
      const processingLag = mcpStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Search API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`MCP tool avg: ${mcpStats.avg.toFixed(2)}ms (${mcpStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (adjusted for MCP overhead)
      expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
      expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
    },
    { retry: 2 },
  ); // Retry up to 2 times for network/API variability

  test.serial(
    'Express API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const mcpTimes: number[] = [];

      // Express API is slower due to AI processing, reduce iterations
      // With retry: 3 iterations × 3 attempts × ~7s = ~63s max (safer than 5 iterations)
      const expressIterations = 3;

      for (let i = 0; i < expressIterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
        await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${YDC_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': USER_AGENT,
          },
          body: JSON.stringify({
            agent: 'express',
            input: 'What is JavaScript?',
            stream: false,
          }),
        });
        rawTimes.push(performance.now() - rawStart);

        // MCP tool call (with abstraction overhead)
        const mcpStart = performance.now();
        await client.callTool({
          name: 'you-express',
          arguments: {
            input: 'What is JavaScript?',
          },
        });
        mcpTimes.push(performance.now() - mcpStart);

        // Longer delay between iterations to avoid rate limiting
        await Bun.sleep(500);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const mcpStats = calculateStats(mcpTimes);
      const processingLag = mcpStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Express API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`MCP tool avg: ${mcpStats.avg.toFixed(2)}ms (${mcpStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (adjusted for MCP overhead)
      expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
      expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
    },
    { timeout: 90_000, retry: 2 },
  ); // 90s timeout + retry for Express API (AI processing + network variability)

  test.serial(
    'Contents API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const mcpTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
        await fetch(CONTENTS_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': YDC_API_KEY,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
          },
          body: JSON.stringify({
            urls: ['https://documentation.you.com/developer-resources/mcp-server'],
            format: 'markdown',
          }),
        });
        rawTimes.push(performance.now() - rawStart);

        // MCP tool call (with abstraction overhead)
        const mcpStart = performance.now();
        await client.callTool({
          name: 'you-contents',
          arguments: {
            urls: ['https://documentation.you.com/developer-resources/mcp-server'],
            format: 'markdown',
          },
        });
        mcpTimes.push(performance.now() - mcpStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const mcpStats = calculateStats(mcpTimes);
      const processingLag = mcpStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Contents API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`MCP tool avg: ${mcpStats.avg.toFixed(2)}ms (${mcpStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (adjusted for MCP overhead)
      expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
      expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
    },
    { retry: 2 },
  ); // Retry up to 2 times for network/API variability

  test.serial(
    'Memory overhead from MCP abstraction',
    async () => {
      // Create dedicated client for memory test to avoid shared state issues
      // (long-running tests may disconnect the shared client)
      console.log('\n=== Memory Test: Creating dedicated client ===');
      const stdioPath = Bun.resolveSync('../../bin/stdio', import.meta.dir);
      const transport = new StdioClientTransport({
        command: 'npx',
        args: [stdioPath],
        env: {
          YDC_API_KEY,
        },
      });

      const memoryClient = new Client({
        name: 'memory-test-client',
        version: '0.0.1',
      });

      await memoryClient.connect(transport);

      // Baseline warmup: eliminate one-time allocations
      console.log('Running baseline warmup...');
      for (let i = 0; i < 3; i++) {
        await memoryClient.callTool({
          name: 'you-search',
          arguments: { query: 'warmup', count: 2 },
        });
      }

      // Force GC and stabilize
      Bun.gc(true);
      await Bun.sleep(100);

      const beforeHeap = heapStats();

      // Run operations with increased iterations for better statistical significance
      const memoryIterations = 15;
      for (let i = 0; i < memoryIterations; i++) {
        await memoryClient.callTool({
          name: 'you-search',
          arguments: { query: `memory test ${i}`, count: 2 },
        });
      }

      // Force GC after measurement
      Bun.gc(true);
      await Bun.sleep(100);

      const afterHeap = heapStats();

      const heapGrowth = afterHeap.heapSize - beforeHeap.heapSize;
      const perOpGrowth = heapGrowth / memoryIterations;

      console.log('\n=== Memory Overhead ===');
      console.log(`Heap before: ${(beforeHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Heap after: ${(afterHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Total growth: ${(heapGrowth / 1024).toFixed(2)} KB`);
      console.log(`Per-operation growth: ${(perOpGrowth / 1024).toFixed(2)} KB`);
      console.log(`Growth pattern: ${perOpGrowth < 1024 ? 'Constant (good)' : 'Linear (check for leaks)'}`);

      // Clean up dedicated client
      await memoryClient.close();

      // Assert memory overhead threshold
      // MCP server maintains state, schemas, and buffers, so 400KB is reasonable
      expect(heapGrowth).toBeLessThan(1024 * 400); // < 400KB
    },
    { timeout: 15_000 },
  ); // 15 second timeout for memory test (18 API calls + GC operations)
});

describe('Processing Lag Summary', () => {
  test('displays threshold information', () => {
    console.log('\n=== Processing Lag Thresholds ===');
    console.log('Absolute lag: < 100ms');
    console.log('Relative overhead: < 50%');
    console.log('Memory overhead: < 400KB');
    console.log('\nNote: These tests measure the overhead introduced by our MCP');
    console.log('abstraction layer compared to raw API calls. We cannot improve');
    console.log('the You.com API performance itself, but we monitor what lag');
    console.log('our code adds to ensure it remains minimal.');
    expect(true).toBe(true);
  });
});
