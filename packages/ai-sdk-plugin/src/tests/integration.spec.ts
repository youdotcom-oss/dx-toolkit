import { beforeAll, describe, expect, test } from 'bun:test';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { youContents, youExpress, youSearch } from '../main.ts';

/**
 * Integration tests for AI SDK Plugin
 *
 * Test Strategy:
 * - Smoke tests: Verify each tool wrapper executes without errors
 * - Error handling: Wrapper-specific validation (API key checks)
 * - AI SDK integration: Comprehensive tests of actual usage patterns
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key
 * - ANTHROPIC_API_KEY: Anthropic API key (for AI SDK integration tests)
 *
 * Note: The @youdotcom-oss/mcp package thoroughly tests the underlying
 * API utilities. These tests focus on the AI SDK wrapper functionality
 * and integration, which is this package's primary value.
 */

/**
 * Type helper to narrow execute result to non-async type
 */
const getExecuteResult = <T>(result: T | AsyncIterable<T> | undefined): T => {
  if (!result || typeof result === 'symbol' || Symbol.asyncIterator in Object(result)) {
    throw new Error('Invalid result type');
  }
  return result as T;
};

describe('AI SDK Plugin Integration Tests', () => {
  const apiKey = process.env.YDC_API_KEY;
  beforeAll(() => {
    if (!apiKey) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests');
    }
  });

  describe('Smoke Tests', () => {
    test(
      'youSearch - basic wrapper execution',
      async () => {
        const searchTool = youSearch({ apiKey });
        const executeResult = await searchTool.execute?.(
          {
            query: 'TypeScript best practices',
            count: 3,
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate wrapper returns raw API response
        const result = getExecuteResult(executeResult) as any;
        expect(result.results).toBeDefined();
        expect(result.results.web).toBeDefined();
        expect(Array.isArray(result.results.web)).toBe(true);
        expect(result.results.web.length).toBeGreaterThan(0);

        const firstResult = result.results.web[0];
        expect(firstResult?.url).toBeDefined();
        expect(firstResult?.title).toBeDefined();
        expect(firstResult?.description).toBeDefined();
      },
      { timeout: 30_000, retry: 2 },
    );

    test(
      'youExpress - basic wrapper execution',
      async () => {
        const expressTool = youExpress({ apiKey });
        const executeResult = await expressTool.execute?.(
          {
            input: 'What are the key benefits of using TypeScript?',
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate wrapper returns raw API response
        const result = getExecuteResult(executeResult);
        expect(result.answer).toBeDefined();
        expect(typeof result.answer).toBe('string');
        expect(result.answer.length).toBeGreaterThan(0);
        expect(result.answer.toLowerCase()).toContain('typescript');
      },
      { timeout: 60_000, retry: 2 },
    );

    test(
      'youContents - basic wrapper execution',
      async () => {
        const contentsTool = youContents({ apiKey });
        const executeResult = await contentsTool.execute?.(
          {
            urls: ['https://documentation.you.com/developer-resources/mcp-server'],
            format: 'markdown',
          },
          { toolCallId: 'test', messages: [] },
        );

        // Validate wrapper returns raw API response
        const result = getExecuteResult(executeResult) as any;
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.url).toBe('https://documentation.you.com/developer-resources/mcp-server');
        expect(result[0]?.markdown).toBeDefined();
        expect(typeof result[0]?.markdown).toBe('string');
        expect(result[0]?.markdown?.length).toBeGreaterThan(0);
      },
      { timeout: 30_000, retry: 2 },
    );
  });

  describe('Error Handling', () => {
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

  describe('AI SDK Integration', () => {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    test(
      'single tool with generateText',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
          },
          prompt: 'Search for the latest developments in AI agents',
        });

        // Validate tool execution
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);
        expect(result.toolCalls[0]?.toolName).toBe('search');

        // Validate tool results contain raw API response
        expect(result.toolResults).toBeDefined();
        expect(result.toolResults.length).toBeGreaterThan(0);

        // Extract tool result from steps
        const toolResult = result.steps?.[0]?.content?.find((c: any) => c.type === 'tool-result') as any;
        expect(toolResult).toBeDefined();
        expect(toolResult?.output).toBeDefined();

        // Validate raw API response structure
        const output = toolResult?.output as any;
        expect(output.results).toBeDefined();
        expect(output.results.web).toBeDefined();
        expect(Array.isArray(output.results.web)).toBe(true);
        expect(output.results.web.length).toBeGreaterThan(0);

        const firstResult = output.results.web[0];
        expect(firstResult.url).toBeDefined();
        expect(firstResult.title).toBeDefined();
        expect(firstResult.description).toBeDefined();
      },
      { timeout: 120_000, retry: 2 },
    );

    test(
      'multiple tools with generateText',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
            extract: youContents({ apiKey }),
            agent: youExpress({ apiKey }),
          },
          prompt: 'Search for information about TypeScript, then extract content from the top result',
          maxSteps: 5,
        });

        // Validate multiple tool calls can happen
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Validate tool results
        expect(result.toolResults).toBeDefined();
        expect(result.toolResults.length).toBeGreaterThan(0);

        // At least one tool should have been called
        const toolNames = result.toolCalls.map((call) => call.toolName);
        expect(toolNames.length).toBeGreaterThan(0);
      },
      { timeout: 180_000, retry: 2 },
    );

    test(
      'tools work with streamText',
      async () => {
        const result = streamText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
          },
          prompt: 'Search for recent TypeScript updates',
          maxSteps: 3,
        });

        // Collect all chunks
        const chunks: string[] = [];
        for await (const chunk of result.textStream) {
          chunks.push(chunk);
        }

        // Validate streaming produced content
        expect(chunks.length).toBeGreaterThan(0);
        const fullText = chunks.join('');
        expect(fullText.length).toBeGreaterThan(0);

        // Validate tool was called
        const finalResult = await result.response;
        expect(finalResult).toBeDefined();
      },
      { timeout: 120_000, retry: 2 },
    );

    test(
      'tool errors are handled gracefully in AI context',
      async () => {
        // Use invalid API key - should fail but not crash generateText
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: 'invalid-key' }),
          },
          prompt: 'Search for TypeScript',
          maxSteps: 2,
        });

        // The AI should still respond, possibly indicating tool failure
        expect(result.text).toBeDefined();
        expect(result.toolCalls).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );
  });
});
