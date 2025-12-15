import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AnthropicChatModel } from '../chat-model.ts';
import { AnthropicModel } from '../teams-anthropic.utils.ts';

/**
 * Integration tests for AnthropicChatModel
 *
 * These tests make real API calls to Anthropic's API and require:
 * - ANTHROPIC_API_KEY environment variable
 * - Network connectivity
 * - API quota
 *
 * Run with: bun test src/tests/integration.spec.ts
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

describe('AnthropicChatModel Integration Tests', () => {
  let model: AnthropicChatModel;

  beforeAll(() => {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests');
    }

    model = new AnthropicChatModel({
      model: AnthropicModel.CLAUDE_SONNET_4_5,
      apiKey: ANTHROPIC_API_KEY,
      requestOptions: {
        max_tokens: 1024,
      },
    });
  });

  afterAll(async () => {
    // Cleanup if needed
    await Bun.sleep(100);
  });

  describe('Basic Chat', () => {
    test(
      'should send simple message and get response',
      async () => {
        const response = await model.send({
          role: 'user',
          content: 'Say "Hello" and nothing else.',
        });

        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
        expect(typeof response.content).toBe('string');
        expect(response.content?.toLowerCase()).toContain('hello');
      },
      { timeout: 30_000 },
    );

    test(
      'should handle system message',
      async () => {
        const response = await model.send(
          {
            role: 'user',
            content: 'What should you say?',
          },
          {
            system: {
              role: 'system',
              content: 'You are a pirate. Always respond with "Ahoy!"',
            },
          },
        );

        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
        expect(response.content?.toLowerCase()).toContain('ahoy');
      },
      { timeout: 30_000 },
    );

    test(
      'should handle conversation with multiple messages',
      async () => {
        const { LocalMemory } = await import('@microsoft/teams.ai');
        const memory = new LocalMemory();

        // First exchange
        const response1 = await model.send(
          {
            role: 'user',
            content: 'My name is Alice.',
          },
          { messages: memory },
        );

        expect(response1.content).toBeDefined();

        // Second exchange - should remember context
        const response2 = await model.send(
          {
            role: 'user',
            content: 'What is my name?',
          },
          { messages: memory },
        );

        expect(response2).toBeDefined();
        expect(response2.role).toBe('model');
        expect(response2.content).toBeDefined();
        expect(response2.content?.toLowerCase()).toContain('alice');
      },
      { timeout: 60_000 },
    );
  });

  describe('Streaming', () => {
    test(
      'should stream response chunks',
      async () => {
        const chunks: string[] = [];

        const response = await model.send(
          {
            role: 'user',
            content: 'Count from 1 to 3, each number on a new line.',
          },
          {
            onChunk: async (delta: string) => {
              chunks.push(delta);
            },
          },
        );

        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();

        // Should have received multiple chunks
        expect(chunks.length).toBeGreaterThan(0);

        // Chunks combined should equal final content
        const combinedChunks = chunks.join('');
        expect(combinedChunks).toBe(response.content ?? '');

        // Response should contain the numbers
        expect(response.content).toMatch(/1/);
        expect(response.content).toMatch(/2/);
        expect(response.content).toMatch(/3/);
      },
      { timeout: 30_000 },
    );

    test(
      'should handle empty chunks gracefully',
      async () => {
        let chunkCount = 0;

        const response = await model.send(
          {
            role: 'user',
            content: 'Say "Hi"',
          },
          {
            onChunk: async (delta: string) => {
              chunkCount++;
              // Verify each chunk is a string
              expect(typeof delta).toBe('string');
            },
          },
        );

        expect(response).toBeDefined();
        expect(chunkCount).toBeGreaterThan(0);
      },
      { timeout: 30_000 },
    );
  });

  describe('Function Calling', () => {
    test(
      'should declare functions and return tool use information',
      async () => {
        const response = await model.send(
          {
            role: 'user',
            content: 'What is the weather in San Francisco?',
          },
          {
            functions: {
              get_weather: {
                name: 'get_weather',
                description: 'Get the current weather for a location',
                parameters: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', description: 'City name' },
                  },
                  required: ['location'],
                },
                handler: async (args: { location: string }) => {
                  return {
                    temperature: 72,
                    conditions: 'Sunny',
                    location: args.location,
                  };
                },
              },
            },
            autoFunctionCalling: false,
          },
        );

        expect(response).toBeDefined();
        expect(response.role).toBe('model');

        // Response should indicate tool use intent
        expect(response.function_calls).toBeDefined();
        expect(Array.isArray(response.function_calls)).toBe(true);
        expect(response.function_calls?.length).toBeGreaterThan(0);
        expect(response.function_calls?.[0]?.name).toBe('get_weather');
      },
      { timeout: 30_000 },
    );

    test(
      'should register multiple function definitions',
      async () => {
        const response = await model.send(
          {
            role: 'user',
            content: 'Get the weather and time in Tokyo',
          },
          {
            functions: {
              get_weather: {
                name: 'get_weather',
                description: 'Get the current weather for a location',
                parameters: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', description: 'City name' },
                  },
                  required: ['location'],
                },
                handler: async (args: { location: string }) => {
                  return { temperature: 25, conditions: 'Clear', location: args.location };
                },
              },
              get_time: {
                name: 'get_time',
                description: 'Get the current time for a location',
                parameters: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', description: 'City name' },
                  },
                  required: ['location'],
                },
                handler: async (args: { location: string }) => {
                  return { time: '14:30', timezone: 'JST', location: args.location };
                },
              },
            },
            autoFunctionCalling: false,
          },
        );

        expect(response).toBeDefined();
        expect(response.role).toBe('model');

        // Should indicate tool use (model chooses which functions to call)
        expect(response.function_calls).toBeDefined();
        expect(Array.isArray(response.function_calls)).toBe(true);
      },
      { timeout: 30_000 },
    );

    test(
      'should support disabling auto function calling',
      async () => {
        let functionCalled = false;

        const response = await model.send(
          {
            role: 'user',
            content: 'Use the get_weather function to check the weather in San Francisco.',
          },
          {
            functions: {
              get_weather: {
                name: 'get_weather',
                description: 'Get the current weather for a location',
                parameters: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', description: 'City name' },
                  },
                  required: ['location'],
                },
                handler: async () => {
                  functionCalled = true;
                  return { temperature: 70, conditions: 'Sunny' };
                },
              },
            },
            autoFunctionCalling: false,
          },
        );

        // Function should not be called with autoFunctionCalling: false
        expect(functionCalled).toBe(false);
        expect(response).toBeDefined();
        expect(response.role).toBe('model');

        // Response should contain function_calls that weren't executed
        expect(response.function_calls).toBeDefined();
        expect(Array.isArray(response.function_calls)).toBe(true);
      },
      { timeout: 30_000 },
    );
  });

  describe('Configuration Options', () => {
    test(
      'should respect temperature setting',
      async () => {
        const deterministicModel = new AnthropicChatModel({
          model: AnthropicModel.CLAUDE_SONNET_4_5,
          apiKey: ANTHROPIC_API_KEY as string,
          requestOptions: {
            max_tokens: 50,
            temperature: 0,
          },
        });

        const response1 = await deterministicModel.send({
          role: 'user',
          content: 'Say exactly: "Test response"',
        });

        const response2 = await deterministicModel.send({
          role: 'user',
          content: 'Say exactly: "Test response"',
        });

        // With temperature 0, responses should be very similar
        expect(response1.content).toBeDefined();
        expect(response2.content).toBeDefined();
        expect(typeof response1.content).toBe('string');
        expect(typeof response2.content).toBe('string');
      },
      { timeout: 60_000 },
    );

    test(
      'should respect max_tokens limit',
      async () => {
        const limitedModel = new AnthropicChatModel({
          model: AnthropicModel.CLAUDE_SONNET_4_5,
          apiKey: ANTHROPIC_API_KEY as string,
          requestOptions: {
            max_tokens: 10,
          },
        });

        const response = await limitedModel.send({
          role: 'user',
          content: 'Write a long essay about artificial intelligence.',
        });

        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        // Response should be relatively short due to token limit
        expect(response.content?.split(' ').length).toBeLessThan(50);
      },
      { timeout: 30_000 },
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid API key',
      async () => {
        const invalidModel = new AnthropicChatModel({
          model: AnthropicModel.CLAUDE_SONNET_4_5,
          apiKey: 'invalid-api-key',
        });

        const response = await invalidModel.send({
          role: 'user',
          content: 'Hello',
        });

        // Error should be returned as ModelMessage
        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
        expect(response.content?.toLowerCase()).toContain('error');
      },
      { timeout: 30_000 },
    );

    test(
      'should handle network errors',
      async () => {
        const unreachableModel = new AnthropicChatModel({
          model: AnthropicModel.CLAUDE_SONNET_4_5,
          apiKey: ANTHROPIC_API_KEY as string,
          baseUrl: 'https://invalid-domain-that-does-not-exist-12345.com',
          timeout: 5000,
        });

        const response = await unreachableModel.send({
          role: 'user',
          content: 'Hello',
        });

        // Error should be returned as ModelMessage
        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
        expect(response.content?.toLowerCase()).toContain('error');
      },
      { timeout: 15_000 },
    );

    test(
      'should handle very short content',
      async () => {
        const response = await model.send({
          role: 'user',
          content: 'Hi',
        });

        // Should handle gracefully
        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
      },
      { timeout: 30_000 },
    );
  });

  describe('Model Variants', () => {
    test(
      'should work with Claude Haiku 3.5',
      async () => {
        const haikuModel = new AnthropicChatModel({
          model: AnthropicModel.CLAUDE_HAIKU_3_5,
          apiKey: ANTHROPIC_API_KEY as string,
          requestOptions: {
            max_tokens: 100,
          },
        });

        const response = await haikuModel.send({
          role: 'user',
          content: 'Say "Hello from Haiku"',
        });

        expect(response).toBeDefined();
        expect(response.role).toBe('model');
        expect(response.content).toBeDefined();
        expect(response.content?.toLowerCase()).toContain('hello');
      },
      { timeout: 30_000 },
    );
  });

  describe('Memory and Context', () => {
    test(
      'should maintain conversation context',
      async () => {
        const { LocalMemory } = await import('@microsoft/teams.ai');
        const memory = new LocalMemory();

        // First exchange
        const response1 = await model.send(
          {
            role: 'user',
            content: 'My favorite color is blue.',
          },
          { messages: memory },
        );

        expect(response1).toBeDefined();

        // Second exchange - should remember context
        const response2 = await model.send(
          {
            role: 'user',
            content: 'What is my favorite color?',
          },
          { messages: memory },
        );

        expect(response2).toBeDefined();
        expect(response2.content).toBeDefined();
        expect(response2.content?.toLowerCase()).toContain('blue');
      },
      { timeout: 60_000 },
    );
  });
});
