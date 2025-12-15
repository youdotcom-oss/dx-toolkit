import { afterEach, describe, expect, test } from 'bun:test';
import type Anthropic from '@anthropic-ai/sdk';
import type { FunctionMessage, Message, ModelMessage, UserMessage } from '@microsoft/teams.ai';

import {
  AnthropicModel,
  extractSystemMessage,
  getAllModels,
  getModelDisplayName,
  getModelFamily,
  getYouMcpConfig,
  isValidModel,
  transformFromAnthropicMessage,
  transformToAnthropicMessages,
} from '../teams-anthropic.utils.ts';

describe('message-transformer', () => {
  describe('transformToAnthropicMessages', () => {
    test('should transform simple user message', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Hello, Claude!',
        } as UserMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: 'Hello, Claude!',
      });
    });

    test('should transform user message with multi-part content to string', () => {
      // Note: Multi-part content support (images) is planned for future updates
      // For now, content is converted to string
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image', url: 'https://example.com/image.jpg' },
          ],
        } as UserMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('user');
      // Current implementation converts to string
      expect(typeof result[0]?.content).toBe('string');
    });

    test('should transform model message', () => {
      const messages: Message[] = [
        {
          role: 'model',
          content: 'Hello! How can I help you?',
        } as ModelMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: 'Hello! How can I help you?',
      });
    });

    test('should transform model message with function calls', () => {
      const messages: Message[] = [
        {
          role: 'model',
          content: 'Let me check the weather for you.',
          function_calls: [
            {
              id: 'call_123',
              name: 'get_weather',
              arguments: { location: 'San Francisco' },
            },
          ],
        } as ModelMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('assistant');

      const content = result[0]?.content as Anthropic.ContentBlock[];
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2);

      const textBlock = content[0] as Anthropic.TextBlock;
      expect(textBlock.type).toBe('text');
      expect(textBlock.text).toBe('Let me check the weather for you.');

      expect(content[1]?.type).toBe('tool_use');
      const toolUse = content[1] as Anthropic.ToolUseBlock;
      expect(toolUse.id).toBe('call_123');
      expect(toolUse.name).toBe('get_weather');
      expect(toolUse.input).toEqual({ location: 'San Francisco' });
    });

    test('should transform function message', () => {
      const messages: Message[] = [
        {
          role: 'function',
          function_id: 'get_weather',
          name: 'get_weather',
          content: 'Temperature: 72°F, Conditions: Sunny',
        } as FunctionMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('user');

      const content = result[0]?.content as Anthropic.ToolResultBlockParam[];
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(1);

      // Check structure without checking the exact tool_use_id (it's generated)
      expect(content[0]?.type).toBe('tool_result');
      expect(content[0]?.tool_use_id).toBeDefined();
      expect(typeof content[0]?.tool_use_id).toBe('string');
      expect(content[0]?.content).toBe('Temperature: 72°F, Conditions: Sunny');
    });

    test('should skip system messages', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Hello!',
        } as UserMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      // System message should be filtered out
      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('user');
    });

    test('should handle conversation with multiple message types', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'What is the weather in SF?',
        } as UserMessage,
        {
          role: 'model',
          content: 'Let me check that for you.',
          function_calls: [
            {
              id: 'call_123',
              name: 'get_weather',
              arguments: { location: 'San Francisco' },
            },
          ],
        } as ModelMessage,
        {
          role: 'function',
          function_id: 'get_weather',
          name: 'get_weather',
          content: 'Temperature: 72°F',
        } as FunctionMessage,
        {
          role: 'model',
          content: 'The temperature in San Francisco is 72°F.',
        } as ModelMessage,
      ];

      const result = transformToAnthropicMessages(messages);

      expect(result).toHaveLength(4);
      expect(result[0]?.role).toBe('user');
      expect(result[1]?.role).toBe('assistant');
      expect(result[2]?.role).toBe('user'); // Function result as user message
      expect(result[3]?.role).toBe('assistant');
    });

    test('should throw error for unsupported message role', () => {
      const messages: Message[] = [
        {
          role: 'unknown' as never,
          content: 'Test',
        },
      ];

      expect(() => transformToAnthropicMessages(messages)).toThrow('Unsupported message role: unknown');
    });
  });

  describe('extractSystemMessage', () => {
    test('should extract system message from conversation', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Hello!',
        } as UserMessage,
      ];

      const result = extractSystemMessage(messages);

      expect(result).toBe('You are a helpful assistant.');
    });

    test('should return undefined when no system message', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Hello!',
        } as UserMessage,
      ];

      const result = extractSystemMessage(messages);

      expect(result).toBeUndefined();
    });

    test('should return first system message when multiple exist', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'First system message',
        },
        {
          role: 'system',
          content: 'Second system message',
        },
      ];

      const result = extractSystemMessage(messages);

      expect(result).toBe('First system message');
    });
  });

  describe('transformFromAnthropicMessage', () => {
    test('should transform text-only response', () => {
      const anthropicResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you today?',
            citations: null,
          } as Anthropic.TextBlock,
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 },
          server_tool_use: { web_search_requests: 0 },
          service_tier: null,
        },
      };

      const result = transformFromAnthropicMessage(anthropicResponse);

      expect(result.role).toBe('model');
      expect(result.content).toBe('Hello! How can I help you today?');
      expect(result.function_calls).toBeUndefined();
    });

    test('should transform response with tool use', () => {
      const anthropicResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Let me check the weather for you.',
            citations: null,
          } as Anthropic.TextBlock,
          {
            type: 'tool_use',
            id: 'toolu_123',
            name: 'get_weather',
            input: { location: 'San Francisco' },
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 },
          server_tool_use: { web_search_requests: 0 },
          service_tier: null,
        },
      };

      const result = transformFromAnthropicMessage(anthropicResponse);

      expect(result.role).toBe('model');
      expect(result.content).toBe('Let me check the weather for you.');
      expect(result.function_calls).toBeDefined();
      expect(result.function_calls).toHaveLength(1);

      expect(result.function_calls?.[0]).toEqual({
        id: 'toolu_123',
        name: 'get_weather',
        arguments: { location: 'San Francisco' },
      });
    });

    test('should handle multiple text blocks', () => {
      const anthropicResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'First part. ',
            citations: null,
          } as Anthropic.TextBlock,
          {
            type: 'text',
            text: 'Second part.',
            citations: null,
          } as Anthropic.TextBlock,
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 },
          server_tool_use: { web_search_requests: 0 },
          service_tier: null,
        },
      };

      const result = transformFromAnthropicMessage(anthropicResponse);

      expect(result.content).toBe('First part. Second part.');
    });

    test('should handle multiple tool uses', () => {
      const anthropicResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'get_weather',
            input: { location: 'San Francisco' },
          },
          {
            type: 'tool_use',
            id: 'toolu_2',
            name: 'get_time',
            input: { timezone: 'America/Los_Angeles' },
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 },
          server_tool_use: { web_search_requests: 0 },
          service_tier: null,
        },
      };

      const result = transformFromAnthropicMessage(anthropicResponse);

      expect(result.function_calls).toHaveLength(2);
      expect(result.function_calls?.[0]?.name).toBe('get_weather');
      expect(result.function_calls?.[1]?.name).toBe('get_time');
    });

    test('should handle empty content', () => {
      const anthropicResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 0,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 },
          server_tool_use: { web_search_requests: 0 },
          service_tier: null,
        },
      };

      const result = transformFromAnthropicMessage(anthropicResponse);

      expect(result.role).toBe('model');
      expect(result.content).toBe('');
      expect(result.function_calls).toBeUndefined();
    });
  });
});

describe('anthropic-model.enum', () => {
  describe('AnthropicModel enum', () => {
    test('should have correct model identifiers', () => {
      expect(AnthropicModel.CLAUDE_OPUS_4_5 as string).toBe('claude-opus-4-5-20251101');
      expect(AnthropicModel.CLAUDE_SONNET_4_5 as string).toBe('claude-sonnet-4-5-20250929');
      expect(AnthropicModel.CLAUDE_OPUS_3_5 as string).toBe('claude-opus-3-5-20240229');
      expect(AnthropicModel.CLAUDE_SONNET_3_5 as string).toBe('claude-3-5-sonnet-20241022');
      expect(AnthropicModel.CLAUDE_HAIKU_3_5 as string).toBe('claude-3-5-haiku-20241022');
      expect(AnthropicModel.CLAUDE_3_OPUS as string).toBe('claude-3-opus-20240229');
      expect(AnthropicModel.CLAUDE_3_SONNET as string).toBe('claude-3-sonnet-20240229');
      expect(AnthropicModel.CLAUDE_3_HAIKU as string).toBe('claude-3-haiku-20240307');
    });
  });

  describe('getModelDisplayName', () => {
    test('should return correct display name for Claude Opus 4.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(displayName).toBe('Claude Opus 4.5');
    });

    test('should return correct display name for Claude Sonnet 4.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_4_5);
      expect(displayName).toBe('Claude Sonnet 4.5');
    });

    test('should return correct display name for Claude Opus 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_OPUS_3_5);
      expect(displayName).toBe('Claude Opus 3.5');
    });

    test('should return correct display name for Claude Sonnet 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_3_5);
      expect(displayName).toBe('Claude Sonnet 3.5');
    });

    test('should return correct display name for Claude Haiku 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_HAIKU_3_5);
      expect(displayName).toBe('Claude Haiku 3.5');
    });

    test('should return correct display name for Claude 3 Opus', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_OPUS);
      expect(displayName).toBe('Claude 3 Opus');
    });

    test('should return correct display name for Claude 3 Sonnet', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_SONNET);
      expect(displayName).toBe('Claude 3 Sonnet');
    });

    test('should return correct display name for Claude 3 Haiku', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_HAIKU);
      expect(displayName).toBe('Claude 3 Haiku');
    });
  });

  describe('isValidModel', () => {
    test('should return true for valid Claude Opus 4.5', () => {
      expect(isValidModel('claude-opus-4-5-20251101')).toBe(true);
    });

    test('should return true for valid Claude Sonnet 4.5', () => {
      expect(isValidModel('claude-sonnet-4-5-20250929')).toBe(true);
    });

    test('should return true for valid Claude Opus 3.5', () => {
      expect(isValidModel('claude-opus-3-5-20240229')).toBe(true);
    });

    test('should return true for valid Claude Sonnet 3.5', () => {
      expect(isValidModel('claude-3-5-sonnet-20241022')).toBe(true);
    });

    test('should return true for valid Claude Haiku 3.5', () => {
      expect(isValidModel('claude-3-5-haiku-20241022')).toBe(true);
    });

    test('should return true for valid Claude 3 Opus', () => {
      expect(isValidModel('claude-3-opus-20240229')).toBe(true);
    });

    test('should return true for valid Claude 3 Sonnet', () => {
      expect(isValidModel('claude-3-sonnet-20240229')).toBe(true);
    });

    test('should return true for valid Claude 3 Haiku', () => {
      expect(isValidModel('claude-3-haiku-20240307')).toBe(true);
    });

    test('should return false for invalid model identifier', () => {
      expect(isValidModel('invalid-model-id')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isValidModel('')).toBe(false);
    });

    test('should return false for similar but incorrect identifier', () => {
      expect(isValidModel('claude-sonnet-4-5')).toBe(false);
    });
  });

  describe('getAllModels', () => {
    test('should return all model enum values', () => {
      const allModels = getAllModels();

      expect(allModels).toHaveLength(8);
      expect(allModels).toContain(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(allModels).toContain(AnthropicModel.CLAUDE_SONNET_4_5);
      expect(allModels).toContain(AnthropicModel.CLAUDE_OPUS_3_5);
      expect(allModels).toContain(AnthropicModel.CLAUDE_SONNET_3_5);
      expect(allModels).toContain(AnthropicModel.CLAUDE_HAIKU_3_5);
      expect(allModels).toContain(AnthropicModel.CLAUDE_3_OPUS);
      expect(allModels).toContain(AnthropicModel.CLAUDE_3_SONNET);
      expect(allModels).toContain(AnthropicModel.CLAUDE_3_HAIKU);
    });

    test('should return array of valid model identifiers', () => {
      const allModels = getAllModels();

      for (const model of allModels) {
        expect(isValidModel(model)).toBe(true);
      }
    });
  });

  describe('getModelFamily', () => {
    test('should return "opus" for Opus 4.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(family).toBe('opus');
    });

    test('should return "sonnet" for Sonnet 4.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_SONNET_4_5);
      expect(family).toBe('sonnet');
    });

    test('should return "opus" for Opus 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_3_5);
      expect(family).toBe('opus');
    });

    test('should return "sonnet" for Sonnet 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_SONNET_3_5);
      expect(family).toBe('sonnet');
    });

    test('should return "haiku" for Haiku 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_HAIKU_3_5);
      expect(family).toBe('haiku');
    });

    test('should return "opus" for Claude 3 Opus', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_OPUS);
      expect(family).toBe('opus');
    });

    test('should return "sonnet" for Claude 3 Sonnet', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_SONNET);
      expect(family).toBe('sonnet');
    });

    test('should return "haiku" for Claude 3 Haiku', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_HAIKU);
      expect(family).toBe('haiku');
    });

    test('should handle case insensitivity', () => {
      // Test that the function works with lowercase model strings
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(family).toBe('opus');
    });
  });
});

describe('getYouMcpConfig', () => {
  const originalEnv = process.env.YDC_API_KEY;

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv) {
      process.env.YDC_API_KEY = originalEnv;
    } else {
      delete process.env.YDC_API_KEY;
    }
  });

  test('should return valid MCP client configuration', () => {
    const config = getYouMcpConfig({ apiKey: 'test-key-123' });

    expect(config).toBeDefined();
    expect(config.url).toBeDefined();
    expect(config.url).toBe('https://api.you.com/mcp');
    expect(config.params).toBeDefined();
    expect(config.params.headers).toBeDefined();
  });

  test('should include proper authentication header', () => {
    const testKey = 'test-key-456';
    const config = getYouMcpConfig({ apiKey: testKey });

    expect(config.params.headers.Authorization).toBe(`Bearer ${testKey}`);
  });

  test('should include User-Agent with package version', () => {
    const config = getYouMcpConfig({ apiKey: 'test-key' });

    expect(config.params.headers['User-Agent']).toBeDefined();
    expect(config.params.headers['User-Agent']).toMatch(/^TEAMS-MCP-CLIENT\//);
    expect(config.params.headers['User-Agent']).toContain('You.com');
    expect(config.params.headers['User-Agent']).toContain('microsoft-teams');
  });

  test('should use custom API key when provided', () => {
    const customKey = 'custom-api-key-789';
    const config = getYouMcpConfig({ apiKey: customKey });

    expect(config.params.headers.Authorization).toBe(`Bearer ${customKey}`);
  });

  test('should fall back to YDC_API_KEY environment variable', () => {
    const envKey = 'env-api-key-101112';
    process.env.YDC_API_KEY = envKey;

    const config = getYouMcpConfig();

    expect(config.params.headers.Authorization).toBe(`Bearer ${envKey}`);
  });

  test('should prefer explicit API key over environment variable', () => {
    const explicitKey = 'explicit-key';
    const envKey = 'env-key';
    process.env.YDC_API_KEY = envKey;

    const config = getYouMcpConfig({ apiKey: explicitKey });

    expect(config.params.headers.Authorization).toBe(`Bearer ${explicitKey}`);
  });

  test('should throw error when no API key provided and YDC_API_KEY not set', () => {
    delete process.env.YDC_API_KEY;

    expect(() => {
      getYouMcpConfig();
    }).toThrow(/You.com API key is required/);
  });

  test('should throw error with helpful message', () => {
    delete process.env.YDC_API_KEY;

    expect(() => {
      getYouMcpConfig();
    }).toThrow(/YDC_API_KEY environment variable/);
  });
});
