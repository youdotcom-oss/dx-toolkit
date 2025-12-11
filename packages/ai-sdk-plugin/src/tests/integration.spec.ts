import { beforeAll, describe, expect, test } from 'bun:test';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { youContents, youExpress, youSearch } from '../main.ts';

/**
 * Integration tests for AI SDK Plugin
 *
 * These tests validate the plugin's functionality with real API calls.
 * Most tests directly call tool.execute?.() for faster execution.
 * One test validates tools work with generateText and AI models.
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key
 * - ANTHROPIC_API_KEY: Anthropic API key (only for generateText test)
 *
 * Test Strategy:
 * - Direct execute tests: Fast, isolated tool validation
 * - generateText test: End-to-end validation with AI model
 * - Uses retry: 2 for network resilience (3 total attempts)
 * - Tests run serially to avoid rate limiting
 */

/**
 * Type helper to narrow execute result to non-async type
 */
const getExecuteResult = <T extends { text: string; data: any }>(result: T | AsyncIterable<T> | undefined): T => {
  if (!result || typeof result === 'symbol' || Symbol.asyncIterator in Object(result)) {
    throw new Error('Invalid result type');
  }
  return result as T;
};

describe('AI SDK Plugin Integration Tests', () => {
  let ydcApiKey: string;
  let anthropic: ReturnType<typeof createAnthropic>;

  beforeAll(() => {
    ydcApiKey = process.env.YDC_API_KEY || '';

    if (!ydcApiKey) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  });

  describe('youSearch tool', () => {
    test(
      'basic web search - returns results with snippets',
      async () => {
        const searchTool = youSearch({ apiKey: ydcApiKey });
        const executeResult = await searchTool.execute?.(
          {
            query: 'TypeScript best practices',
            count: 3,
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate response structure
        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Validate structured data
        expect(result.data).toBeDefined();
        expect(result.data.hits).toBeDefined();
        expect(Array.isArray(result.data.hits)).toBe(true);
      },
      { timeout: 30_000, retry: 2 },
    );

    test(
      'search with filters - site and count',
      async () => {
        const searchTool = youSearch({ apiKey: ydcApiKey });
        const executeResult = await searchTool.execute?.(
          {
            query: 'React hooks',
            site: 'react.dev',
            count: 5,
          },
          { toolCallId: 'test', messages: [] },
        );

        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.hits.length).toBeLessThanOrEqual(5);
      },
      { timeout: 30_000, retry: 2 },
    );

    test(
      'search with env var API key',
      async () => {
        const searchTool = youSearch(); // Uses YDC_API_KEY from env
        const executeResult = await searchTool.execute?.(
          {
            query: 'JavaScript async await',
            count: 2,
          },
          { toolCallId: 'test', messages: [] },
        );

        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(result.data.hits.length).toBeGreaterThan(0);
      },
      { timeout: 30_000, retry: 2 },
    );
  });

  describe('youExpress tool', () => {
    test(
      'agent response - provides AI answer',
      async () => {
        const expressTool = youExpress({ apiKey: ydcApiKey });
        const executeResult = await expressTool.execute?.(
          {
            input: 'What are the key benefits of using TypeScript?',
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate response
        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Should mention TypeScript
        expect(result.text.toLowerCase()).toContain('typescript');

        // Validate structured data
        expect(result.data).toBeDefined();
        expect(result.data.answer).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );

    test(
      'agent with simple query',
      async () => {
        const expressTool = youExpress({ apiKey: ydcApiKey });
        const executeResult = await expressTool.execute?.(
          {
            input: 'What is the current year?',
          },
          { toolCallId: 'test', messages: [] },
        );

        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(result.text).toContain('2025');
      },
      { timeout: 60_000, retry: 2 },
    );
  });

  describe('youContents tool', () => {
    test(
      'single URL extraction - returns markdown content',
      async () => {
        const contentsTool = youContents({ apiKey: ydcApiKey });
        const executeResult = await contentsTool.execute?.(
          {
            urls: ['https://documentation.you.com/developer-resources/mcp-server'],
            format: 'markdown',
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate response
        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Validate structured data
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data[0]?.url).toBe('https://documentation.you.com/developer-resources/mcp-server');
        expect(result.data[0]?.markdown).toBeDefined();
      },
      { timeout: 30_000, retry: 2 },
    );

    test(
      'multiple URL extraction',
      async () => {
        const contentsTool = youContents({ apiKey: ydcApiKey });
        const executeResult = await contentsTool.execute?.(
          {
            urls: [
              'https://documentation.you.com/developer-resources/mcp-server',
              'https://documentation.you.com/developer-resources/python-sdk',
            ],
            format: 'markdown',
          },
          { toolCallId: 'test', messages: [] },
        );

        const result = getExecuteResult(executeResult);
        expect(result.text).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.length).toBe(2);
        expect(result.data[0]?.url).toBe('https://documentation.you.com/developer-resources/mcp-server');
        expect(result.data[1]?.url).toBe('https://documentation.you.com/developer-resources/python-sdk');
      },
      { timeout: 30_000, retry: 2 },
    );
  });

  describe('error handling', () => {
    test('missing API key throws error during execution', async () => {
      const searchTool = youSearch({ apiKey: '' });

      await expect(async () => {
        await searchTool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] });
      }).toThrow(/YDC_API_KEY is required/);
    });

    test('invalid API key format is handled with clear error', async () => {
      const searchTool = youSearch({ apiKey: 'invalid-key-format' });

      await expect(async () => {
        await searchTool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] });
      }).toThrow();
    });
  });

  describe('AI SDK integration', () => {
    test.skipIf(!process.env.ANTHROPIC_API_KEY)(
      'tools work with generateText and trigger multiple tool calls',
      async () => {
        // Complex prompt that should trigger multiple tools:
        // 1. Search for recent info
        // 2. Agent for synthesis
        // 3. Contents for URL extraction
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
            agent: youExpress({ apiKey: ydcApiKey }),
            extract: youContents({ apiKey: ydcApiKey }),
          },
          prompt: `Find recent information about the Vercel AI SDK, get the documentation from https://sdk.vercel.ai,
          and explain the key differences between streaming and non-streaming responses`,
          // Note: maxSteps removed due to type incompatibility with current AI SDK version
        });

        // Validate response structure
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Validate tool usage - at least one tool should be called
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Validate tool results
        expect(result.toolResults).toBeDefined();
        expect(result.toolResults.length).toBeGreaterThan(0);

        // Verify at least one of our tools was called
        const toolNames = result.toolCalls.map((call) => call.toolName);
        const usedTools = toolNames.filter((name) => ['search', 'agent', 'extract'].includes(name));
        expect(usedTools.length).toBeGreaterThan(0);

        console.log(`\n=== Tool Usage Summary ===`);
        console.log(`Total tool calls: ${result.toolCalls.length}`);
        console.log(`Tools used: ${usedTools.join(', ')}`);
        console.log(`Response length: ${result.text.length} characters`);
      },
      { timeout: 120_000, retry: 2 },
    );
  });
});
