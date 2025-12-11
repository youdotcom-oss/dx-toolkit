import { beforeAll, describe, expect, test } from 'bun:test';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { youContents, youExpress, youSearch } from '../main.ts';

/**
 * Integration tests for AI SDK Plugin
 *
 * These tests validate the plugin's functionality with real API calls.
 * They mirror the examples in /examples directory.
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key
 * - ANTHROPIC_API_KEY: Anthropic API key for AI model access
 *
 * Test Strategy:
 * - Uses retry: 2 for network resilience (3 total attempts)
 * - 30-60s timeouts for AI model responses
 * - Tests run serially to avoid rate limiting
 */

describe('AI SDK Plugin Integration Tests', () => {
  let ydcApiKey: string;
  let anthropic: ReturnType<typeof createAnthropic>;

  beforeAll(() => {
    ydcApiKey = process.env.YDC_API_KEY || '';

    if (!ydcApiKey) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests');
    }

    anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  });

  describe('youSearch tool', () => {
    test(
      'basic web search - generates response with tool usage',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
          },
          prompt: 'Search for the latest developments in AI agents',
        });

        // Validate response structure
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Validate tool usage
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Verify search tool was called
        const searchToolCall = result.toolCalls.find((call) => call.toolName === 'search');
        expect(searchToolCall).toBeDefined();

        // Validate tool results
        expect(result.toolResults).toBeDefined();
        expect(result.toolResults.length).toBeGreaterThan(0);
      },
      { timeout: 60_000, retry: 2 },
    );

    test(
      'search with env var API key',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch(), // Uses YDC_API_KEY from env
          },
          prompt: 'Search for TypeScript best practices',
        });

        expect(result.text).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Verify search tool was called
        const searchToolCall = result.toolCalls.find((call) => call.toolName === 'search');
        expect(searchToolCall).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );
  });

  describe('youExpress tool', () => {
    test(
      'agent response with web search - generates AI answer',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            agent: youExpress({ apiKey: ydcApiKey }),
          },
          prompt: 'What are the key benefits of using Model Context Protocol?',
        });

        // Validate response
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Validate tool usage
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Verify agent tool was called
        const agentToolCall = result.toolCalls.find((call) => call.toolName === 'agent');
        expect(agentToolCall).toBeDefined();

        // Validate tool results contain data
        expect(result.toolResults).toBeDefined();
        expect(result.toolResults.length).toBeGreaterThan(0);
      },
      { timeout: 60_000, retry: 2 },
    );

    test(
      'agent with simple query',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            agent: youExpress({ apiKey: ydcApiKey }),
          },
          prompt: 'What is the current year?',
        });

        expect(result.text).toBeDefined();
        expect(result.text).toContain('2025');

        // Verify agent tool was called
        expect(result.toolCalls.length).toBeGreaterThan(0);
        const agentToolCall = result.toolCalls.find((call) => call.toolName === 'agent');
        expect(agentToolCall).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );
  });

  describe('youContents tool', () => {
    test(
      'content extraction - extracts and summarizes page content',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            extract: youContents({ apiKey: ydcApiKey }),
          },
          prompt: 'Extract content from https://modelcontextprotocol.io and summarize what MCP is',
        });

        // Validate response
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);

        // Should mention MCP or Model Context Protocol
        expect(
          result.text.toLowerCase().includes('mcp') || result.text.toLowerCase().includes('model context protocol'),
        ).toBe(true);

        // Validate tool usage
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Verify extract tool was called
        const extractToolCall = result.toolCalls.find((call) => call.toolName === 'extract');
        expect(extractToolCall).toBeDefined();

        // Validate tool results
        expect(result.toolResults.length).toBeGreaterThan(0);
      },
      { timeout: 90_000, retry: 2 },
    );

    test(
      'multiple URL extraction',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            extract: youContents({ apiKey: ydcApiKey }),
          },
          prompt: 'Extract and compare content from https://vercel.com and https://anthropic.com',
        });

        expect(result.text).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Should extract content from both URLs
        const extractToolCalls = result.toolCalls.filter((call) => call.toolName === 'extract');
        expect(extractToolCalls.length).toBeGreaterThan(0);
      },
      { timeout: 90_000, retry: 2 },
    );
  });

  describe('streaming responses', () => {
    test(
      'streamText with youSearch - streams response chunks',
      async () => {
        const result = streamText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
          },
          prompt: 'Search for AI news and summarize',
        });

        const chunks: string[] = [];

        // Collect all chunks
        for await (const chunk of result.textStream) {
          expect(typeof chunk).toBe('string');
          chunks.push(chunk);
        }

        // Validate we received chunks
        expect(chunks.length).toBeGreaterThan(0);

        // Validate full text is available
        const fullText = await result.text;
        expect(fullText).toBeDefined();
        expect(fullText.length).toBeGreaterThan(0);

        // Validate tool usage
        const usage = await result.usage;
        expect(usage).toBeDefined();

        // Verify search tool was called
        const toolCalls = await result.toolCalls;
        expect(toolCalls.length).toBeGreaterThan(0);
        const searchToolCall = toolCalls.find((call) => call.toolName === 'search');
        expect(searchToolCall).toBeDefined();
      },
      { timeout: 90_000, retry: 2 },
    );
  });

  describe('error handling', () => {
    test('missing API key throws error', async () => {
      expect(() => {
        youSearch({ apiKey: '' });
      }).not.toThrow(); // Constructor doesn't throw

      // Error should occur during execution
      await expect(async () => {
        await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: '' }),
          },
          prompt: 'Search for something',
        });
      }).toThrow();
    });

    test('invalid API key format is handled', async () => {
      const invalidKey = 'invalid-key-format';

      // Should fail during API call with clear error
      await expect(async () => {
        await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: invalidKey }),
          },
          prompt: 'Search for something',
        });
      }).toThrow();
    });

    test(
      'tool handles API errors gracefully',
      async () => {
        // This test validates that even with potential API issues,
        // the tool doesn't crash the entire generation
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
          },
          prompt: 'Search for extremely obscure query that might fail',
        });

        // Should complete without throwing
        expect(result.text).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );
  });

  describe('tool configuration', () => {
    test(
      'multiple tools can be used together',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
            agent: youExpress({ apiKey: ydcApiKey }),
            extract: youContents({ apiKey: ydcApiKey }),
          },
          prompt: 'Search for information about Vercel AI SDK and extract details',
        });

        expect(result.text).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // At least one tool should be called
        const toolNames = result.toolCalls.map((call) => call.toolName);
        expect(toolNames.some((name) => ['search', 'agent', 'extract'].includes(name))).toBe(true);
      },
      { timeout: 90_000, retry: 2 },
    );

    test(
      'tools work with different AI models',
      async () => {
        // Test with different Anthropic model
        const result = await generateText({
          model: anthropic('claude-3-5-haiku-20241022'),
          tools: {
            search: youSearch({ apiKey: ydcApiKey }),
          },
          prompt: 'Quick search for TypeScript',
        });

        expect(result.text).toBeDefined();
        expect(result.toolCalls.length).toBeGreaterThan(0);

        // Verify search tool was called
        const searchToolCall = result.toolCalls.find((call) => call.toolName === 'search');
        expect(searchToolCall).toBeDefined();
      },
      { timeout: 60_000, retry: 2 },
    );
  });
});
