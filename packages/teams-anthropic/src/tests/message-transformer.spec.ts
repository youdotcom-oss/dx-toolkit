import { describe, expect, it } from 'bun:test';
import type Anthropic from '@anthropic-ai/sdk';
import type { FunctionMessage, Message, ModelMessage, UserMessage } from '@microsoft/teams.ai';
import {
  extractSystemMessage,
  transformFromAnthropicMessage,
  transformToAnthropicMessages,
} from '../utils/message-transformer.ts';

describe('message-transformer', () => {
  describe('transformToAnthropicMessages', () => {
    it('should transform simple user message', () => {
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

    it('should transform user message with multi-part content to string', () => {
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

    it('should transform model message', () => {
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

    it('should transform model message with function calls', () => {
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

    it('should transform function message', () => {
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

    it('should skip system messages', () => {
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

    it('should handle conversation with multiple message types', () => {
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

    it('should throw error for unsupported message role', () => {
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
    it('should extract system message from conversation', () => {
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

    it('should return undefined when no system message', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Hello!',
        } as UserMessage,
      ];

      const result = extractSystemMessage(messages);

      expect(result).toBeUndefined();
    });

    it('should return first system message when multiple exist', () => {
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
    it('should transform text-only response', () => {
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

    it('should transform response with tool use', () => {
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

    it('should handle multiple text blocks', () => {
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

    it('should handle multiple tool uses', () => {
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

    it('should handle empty content', () => {
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
