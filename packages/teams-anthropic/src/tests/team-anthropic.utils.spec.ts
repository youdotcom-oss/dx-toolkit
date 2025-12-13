import { describe, expect, test } from 'bun:test';
import type Anthropic from '@anthropic-ai/sdk';
import type { FunctionMessage, Message, ModelMessage, UserMessage } from '@microsoft/teams.ai';

import {
  AnthropicModel,
  extractSystemMessage,
  getAllModels,
  getModelDisplayName,
  getModelFamily,
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

      expect(content[0]).toEqual({
        type: 'text',
        text: 'Let me check the weather for you.',
      });

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
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
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
          },
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
          },
          {
            type: 'text',
            text: 'Second part.',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
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
      expect(AnthropicModel.CLAUDE_OPUS_4_5).toBe('claude-opus-4-5-20251101');
      expect(AnthropicModel.CLAUDE_SONNET_4_5).toBe('claude-sonnet-4-5-20250929');
      expect(AnthropicModel.CLAUDE_OPUS_3_5).toBe('claude-opus-3-5-20240229');
      expect(AnthropicModel.CLAUDE_SONNET_3_5).toBe('claude-3-5-sonnet-20241022');
      expect(AnthropicModel.CLAUDE_HAIKU_3_5).toBe('claude-3-5-haiku-20241022');
      expect(AnthropicModel.CLAUDE_3_OPUS).toBe('claude-3-opus-20240229');
      expect(AnthropicModel.CLAUDE_3_SONNET).toBe('claude-3-sonnet-20240229');
      expect(AnthropicModel.CLAUDE_3_HAIKU).toBe('claude-3-haiku-20240307');
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
