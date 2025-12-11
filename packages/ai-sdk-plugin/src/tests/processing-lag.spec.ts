import { heapStats } from 'bun:jsc';
import { beforeAll, describe, expect, test } from 'bun:test';
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
const getUserAgent = () => `AI-SDK/${packageJson.version} (You.com; ai-sdk-plugin-test)`;

// API endpoints
const SEARCH_API_URL = 'https://api.ydc-index.io/search';
const EXPRESS_API_URL = 'https://api.you.com/express';
const CONTENTS_API_URL = 'https://api.ydc-index.io/contents';

beforeAll(async () => {
  console.log('\n=== Warming up ===');

  // Warmup: run both raw API and plugin calls to eliminate cold start effects
  console.log('Running warmup calls to eliminate cold start effects...');

  // Warmup raw API call
  await fetch(SEARCH_API_URL, {
    method: 'GET',
    headers: {
      'X-API-Key': YDC_API_KEY,
      'User-Agent': getUserAgent(),
    },
  });

  // Warmup plugin call
  const searchTool = youSearch({ apiKey: YDC_API_KEY });
  await searchTool.execute?.({ query: 'warmup test' }, { toolCallId: 'warmup', messages: [] });

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
        const rawResponse = await fetch(`${SEARCH_API_URL}?query=test`, {
          method: 'GET',
          headers: {
            'X-API-Key': YDC_API_KEY,
            'User-Agent': getUserAgent(),
          },
        });
        await rawResponse.json();
        rawTimes.push(performance.now() - rawStart);

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await searchTool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] });
        pluginTimes.push(performance.now() - pluginStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
      const avgPlugin = pluginTimes.reduce((a, b) => a + b) / iterations;
      const processingLag = avgPlugin - avgRaw;
      const overheadPercent = (processingLag / avgRaw) * 100;

      console.log('\n=== Search API Processing Lag ===');
      console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
      console.log(`Plugin avg: ${avgPlugin.toFixed(2)}ms`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { timeout: 60_000 },
  );

  test.serial(
    'Express API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const pluginTimes: number[] = [];

      const expressTool = youExpress({ apiKey: YDC_API_KEY });

      for (let i = 0; i < iterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
        const rawResponse = await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${YDC_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': getUserAgent(),
          },
          body: JSON.stringify({
            input: 'test',
            stream: false,
          }),
        });
        await rawResponse.json();
        rawTimes.push(performance.now() - rawStart);

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await expressTool.execute?.({ input: 'test' }, { toolCallId: 'test', messages: [] });
        pluginTimes.push(performance.now() - pluginStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
      const avgPlugin = pluginTimes.reduce((a, b) => a + b) / iterations;
      const processingLag = avgPlugin - avgRaw;
      const overheadPercent = (processingLag / avgRaw) * 100;

      console.log('\n=== Express API Processing Lag ===');
      console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
      console.log(`Plugin avg: ${avgPlugin.toFixed(2)}ms`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { timeout: 60_000 },
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
        const rawResponse = await fetch(CONTENTS_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': YDC_API_KEY,
            'Content-Type': 'application/json',
            'User-Agent': getUserAgent(),
          },
          body: JSON.stringify({
            urls: [testUrl],
            format: 'markdown',
          }),
        });
        await rawResponse.json();
        rawTimes.push(performance.now() - rawStart);

        // Plugin call (with AI SDK tool abstraction overhead)
        const pluginStart = performance.now();
        await contentsTool.execute?.({ urls: [testUrl], format: 'markdown' }, { toolCallId: 'test', messages: [] });
        pluginTimes.push(performance.now() - pluginStart);

        // Small delay between iterations to avoid rate limiting
        await Bun.sleep(100);
      }

      const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
      const avgPlugin = pluginTimes.reduce((a, b) => a + b) / iterations;
      const processingLag = avgPlugin - avgRaw;
      const overheadPercent = (processingLag / avgRaw) * 100;

      console.log('\n=== Contents API Processing Lag ===');
      console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
      console.log(`Plugin avg: ${avgPlugin.toFixed(2)}ms`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (SDK integration)
      expect(processingLag).toBeLessThan(80); // < 80ms absolute lag
      expect(overheadPercent).toBeLessThan(35); // < 35% relative overhead
    },
    { timeout: 60_000 },
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
        await searchTool.execute?.({ query: 'memory test' }, { toolCallId: 'test', messages: [] });
      }

      // Force GC after measurement
      Bun.gc(true);
      await Bun.sleep(100); // Let GC complete

      const afterHeap = heapStats();

      const heapGrowth = afterHeap.heapSize - beforeHeap.heapSize;
      console.log('\n=== Memory Overhead ===');
      console.log(`Heap before: ${(beforeHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Heap after: ${(afterHeap.heapSize / 1024).toFixed(2)} KB`);
      console.log(`Heap growth: ${(heapGrowth / 1024).toFixed(2)} KB`);

      // Assert memory overhead threshold (SDK integration)
      expect(heapGrowth).toBeLessThan(1024 * 350); // < 350KB
    },
    { timeout: 30_000 },
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
