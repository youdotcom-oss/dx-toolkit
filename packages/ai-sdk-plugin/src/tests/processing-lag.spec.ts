import { heapStats } from 'bun:jsc';
import { beforeAll, describe, expect, test } from 'bun:test';
import { CONTENTS_API_URL, EXPRESS_API_URL, SEARCH_API_URL } from '@youdotcom-oss/mcp';
import packageJson from '../../package.json' with { type: 'json' };
import { youContents, youExpress, youSearch } from '../main.ts';

/**
 * Processing Lag Test Suite
 *
 * Measures the overhead introduced by our AI SDK plugin abstraction compared to raw API calls.
 * We can't improve the You.com API performance itself, but we need to quantify what processing
 * lag our plugin layer adds (tool() wrapper, Zod validation, formatting, error handling).
 *
 * Metrics:
 * - Processing lag (absolute time difference)
 * - Overhead percentage (relative overhead)
 * - Memory overhead (heap growth)
 *
 * Thresholds (SDK integration - moderate validation/transformation):
 * - < 80ms absolute processing lag
 * - < 35% relative overhead
 * - < 350KB memory overhead
 */

const YDC_API_KEY = process.env.YDC_API_KEY ?? '';

// User-Agent matching SDK plugin format: AI-SDK/{version} (You.com; {client})
const USER_AGENT = `AI-SDK/${packageJson.version} (You.com; processing-lag-test)`;

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
    outliers: times.length - filtered.length,
  };
};

beforeAll(async () => {
  console.log('\n=== Warming up ===');
  console.log('Running warmup calls to eliminate cold start effects...');

  // Warmup raw API call
  const warmupUrl = new URL(SEARCH_API_URL);
  warmupUrl.searchParams.append('query', 'warmup');
  warmupUrl.searchParams.append('count', '1');

  await fetch(warmupUrl, {
    method: 'GET',
    headers: {
      'X-API-Key': YDC_API_KEY,
      'User-Agent': USER_AGENT,
    },
  });

  // Warmup plugin call
  const searchTool = youSearch({ apiKey: YDC_API_KEY });
  await searchTool.execute?.({ query: 'warmup', count: 1 }, { toolCallId: 'warmup', messages: [] });

  console.log('Warmup complete. Starting measurements...\n');
});

describe('Processing Lag: AI SDK Plugin vs Raw API Calls', () => {
  const iterations = 10;

  test.serial(
    'Search API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const pluginTimes: number[] = [];

      const searchTool = youSearch({ apiKey: YDC_API_KEY });

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

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await searchTool.execute?.(
          {
            query: 'javascript tutorial',
            count: 3,
          },
          { toolCallId: 'test', messages: [] },
        );
        pluginTimes.push(performance.now() - pluginStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const pluginStats = calculateStats(pluginTimes);
      const processingLag = pluginStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Search API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`Plugin avg: ${pluginStats.avg.toFixed(2)}ms (${pluginStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { retry: 2 },
  );

  test.serial(
    'Express API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const pluginTimes: number[] = [];

      const expressTool = youExpress({ apiKey: YDC_API_KEY });

      // Express API is slower due to AI processing, reduce iterations
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

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await expressTool.execute?.(
          {
            input: 'What is JavaScript?',
          },
          { toolCallId: 'test', messages: [] },
        );
        pluginTimes.push(performance.now() - pluginStart);

        // Longer delay between iterations to avoid rate limiting
        await Bun.sleep(500);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const pluginStats = calculateStats(pluginTimes);
      const processingLag = pluginStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Express API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`Plugin avg: ${pluginStats.avg.toFixed(2)}ms (${pluginStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { retry: 2 },
  );

  test.serial(
    'Contents API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const pluginTimes: number[] = [];

      const contentsTool = youContents({ apiKey: YDC_API_KEY });
      const testUrl = 'https://example.com';

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
            urls: [testUrl],
            format: 'markdown',
          }),
        });
        rawTimes.push(performance.now() - rawStart);

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await contentsTool.execute?.(
          {
            urls: [testUrl],
            format: 'markdown',
          },
          { toolCallId: 'test', messages: [] },
        );
        pluginTimes.push(performance.now() - pluginStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      // Calculate statistics with outlier detection
      const rawStats = calculateStats(rawTimes);
      const pluginStats = calculateStats(pluginTimes);
      const processingLag = pluginStats.avg - rawStats.avg;
      const overheadPercent = (processingLag / rawStats.avg) * 100;

      console.log('\n=== Contents API Processing Lag ===');
      console.log(`Raw API avg: ${rawStats.avg.toFixed(2)}ms (${rawStats.outliers} outliers removed)`);
      console.log(`Plugin avg: ${pluginStats.avg.toFixed(2)}ms (${pluginStats.outliers} outliers removed)`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { retry: 2 },
  );

  test.serial(
    'Memory overhead from plugin abstraction',
    async () => {
      // Force GC before measurement
      Bun.gc(true);
      await Bun.sleep(100); // Let GC complete

      const beforeHeap = heapStats();

      // Run multiple operations to measure sustained memory overhead
      const searchTool = youSearch({ apiKey: YDC_API_KEY });
      for (let i = 0; i < 5; i++) {
        await searchTool.execute?.(
          {
            query: 'memory test',
            count: 1,
          },
          { toolCallId: 'test', messages: [] },
        );
      }

      // Force GC after measurement
      Bun.gc(true);
      await Bun.sleep(100); // Let GC complete

      const afterHeap = heapStats();

      const heapGrowth = afterHeap.heapSize - beforeHeap.heapSize;
      const perOpGrowth = heapGrowth / 5;

      console.log('\n=== Memory Overhead ===');
      console.log(`Heap before: ${(beforeHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Heap after: ${(afterHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Total growth: ${(heapGrowth / 1024).toFixed(2)} KB`);
      console.log(`Per-operation growth: ${(perOpGrowth / 1024).toFixed(2)} KB`);
      console.log(
        `Growth pattern: ${heapGrowth < 0 ? 'Constant (good)' : heapGrowth > 100_000 ? 'Linear (check for leaks)' : 'Stable'}`,
      );

      // Assert memory overhead threshold (SDK integration)
      expect(heapGrowth).toBeLessThan(1024 * 350); // < 350KB
    },
    { retry: 2 },
  );
});

describe('Processing Lag Summary', () => {
  test('displays threshold information', () => {
    console.log('\n=== Processing Lag Thresholds ===');
    console.log('Absolute lag: < 80ms');
    console.log('Relative overhead: < 35%');
    console.log('Memory overhead: < 350KB');
    console.log('\nNote: These tests measure the overhead introduced by our');
    console.log('AI SDK plugin abstraction (tool() wrapper, Zod validation,');
    console.log('formatting, error handling) compared to raw API calls. We cannot');
    console.log('improve the You.com API performance itself, but we monitor what');
    console.log('lag our plugin adds to ensure it remains minimal.');
    expect(true).toBe(true);
  });
});
