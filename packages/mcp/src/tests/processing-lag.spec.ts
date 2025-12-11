// biome-ignore lint/suspicious/noConsole: Console output is needed for performance test reporting
import { heapStats } from 'bun:jsc';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { $ } from 'bun';

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

// API Constants
const SEARCH_API_URL = 'https://ydc-index.io/v1/search';
const EXPRESS_API_URL = 'https://api.you.com/v1/agents/runs';
const CONTENTS_API_URL = 'https://ydc-index.io/v1/contents';

const YDC_API_KEY = process.env.YDC_API_KEY ?? '';

beforeAll(async () => {
  console.log('\n=== Warming up: Building and starting MCP server ===');
  await $`bun run build`;

  const transport = new StdioClientTransport({
    command: 'npx',
    args: [Bun.resolveSync('../../bin/stdio', import.meta.dir)],
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

  test.serial('Search API processing lag', async () => {
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
          'User-Agent': 'processing-lag-test/1.0',
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

    const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
    const avgMcp = mcpTimes.reduce((a, b) => a + b) / iterations;
    const processingLag = avgMcp - avgRaw;
    const overheadPercent = (processingLag / avgRaw) * 100;

    console.log('\n=== Search API Processing Lag ===');
    console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
    console.log(`MCP tool avg: ${avgMcp.toFixed(2)}ms`);
    console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
    console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

    // Assert processing lag thresholds (adjusted for MCP overhead)
    expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
    expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
  });

  test.serial(
    'Express API processing lag',
    async () => {
      const rawTimes: number[] = [];
      const mcpTimes: number[] = [];

      // Express API is slower due to AI processing, reduce iterations
      const expressIterations = 5;

      for (let i = 0; i < expressIterations; i++) {
        // Raw API call (baseline)
        const rawStart = performance.now();
        await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${YDC_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'processing-lag-test/1.0',
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

      const avgRaw = rawTimes.reduce((a, b) => a + b) / expressIterations;
      const avgMcp = mcpTimes.reduce((a, b) => a + b) / expressIterations;
      const processingLag = avgMcp - avgRaw;
      const overheadPercent = (processingLag / avgRaw) * 100;

      console.log('\n=== Express API Processing Lag ===');
      console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
      console.log(`MCP tool avg: ${avgMcp.toFixed(2)}ms`);
      console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
      console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

      // Assert processing lag thresholds (adjusted for MCP overhead)
      expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
      expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
    },
    { timeout: 60000 },
  ); // 60 second timeout for Express API (AI processing is slow)

  test.serial('Contents API processing lag', async () => {
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
          'User-Agent': 'processing-lag-test/1.0',
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

    const avgRaw = rawTimes.reduce((a, b) => a + b) / iterations;
    const avgMcp = mcpTimes.reduce((a, b) => a + b) / iterations;
    const processingLag = avgMcp - avgRaw;
    const overheadPercent = (processingLag / avgRaw) * 100;

    console.log('\n=== Contents API Processing Lag ===');
    console.log(`Raw API avg: ${avgRaw.toFixed(2)}ms`);
    console.log(`MCP tool avg: ${avgMcp.toFixed(2)}ms`);
    console.log(`Processing lag: ${processingLag.toFixed(2)}ms`);
    console.log(`Overhead: ${overheadPercent.toFixed(2)}%`);

    // Assert processing lag thresholds (adjusted for MCP overhead)
    expect(processingLag).toBeLessThan(100); // < 100ms absolute lag
    expect(overheadPercent).toBeLessThan(50); // < 50% relative overhead
  });

  test.serial('Memory overhead from MCP abstraction', async () => {
    // Force GC before measurement
    Bun.gc(true);
    await Bun.sleep(100); // Let GC complete

    const beforeHeap = heapStats();

    // Run multiple operations to measure sustained memory overhead
    for (let i = 0; i < 5; i++) {
      await client.callTool({
        name: 'you-search',
        arguments: { query: 'test query', count: 2 },
      });
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

    // Assert memory overhead threshold
    // MCP server maintains state, schemas, and buffers, so 400KB is reasonable
    expect(heapGrowth).toBeLessThan(1024 * 400); // < 400KB
  });
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
