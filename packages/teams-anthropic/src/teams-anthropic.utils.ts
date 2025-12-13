import type Anthropic from '@anthropic-ai/sdk';
import type { FunctionMessage, Message, ModelMessage, SystemMessage, UserMessage } from '@microsoft/teams.ai';

/**
 * Type guard to check if a message is a UserMessage
 */
const isUserMessage = (message: Message): message is UserMessage => message.role === 'user';

/**
 * Type guard to check if a message is a ModelMessage
 */
const isModelMessage = (message: Message): message is ModelMessage => message.role === 'model';

/**
 * Type guard to check if a message is a FunctionMessage
 */
const isFunctionMessage = (message: Message): message is FunctionMessage => message.role === 'function';

/**
 * Type guard to check if a message is a SystemMessage
 */
const isSystemMessage = (message: Message): message is SystemMessage => message.role === 'system';

/**
 * Type-safe enum for Anthropic Claude model identifiers
 *
 * @remarks
 * Enum values match Anthropic's exact model identifiers for API calls.
 * Use these constants instead of string literals for type safety.
 *
 * @example
 * ```typescript
 * const model = new AnthropicChatModel({
 *   model: AnthropicModel.CLAUDE_SONNET_4_5,
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 * });
 * ```
 */
export enum AnthropicModel {
  // Latest generation (4.x series)
  CLAUDE_OPUS_4_5 = 'claude-opus-4-5-20251101',
  CLAUDE_SONNET_4_5 = 'claude-sonnet-4-5-20250929',

  // Previous generation (3.5 series)
  CLAUDE_OPUS_3_5 = 'claude-opus-3-5-20240229',
  CLAUDE_SONNET_3_5 = 'claude-3-5-sonnet-20241022',
  CLAUDE_HAIKU_3_5 = 'claude-3-5-haiku-20241022',

  // Legacy (3.0 series)
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
}

/**
 * Human-readable display names for Claude models
 */
const MODEL_DISPLAY_NAMES: Record<AnthropicModel, string> = {
  [AnthropicModel.CLAUDE_OPUS_4_5]: 'Claude Opus 4.5',
  [AnthropicModel.CLAUDE_SONNET_4_5]: 'Claude Sonnet 4.5',
  [AnthropicModel.CLAUDE_OPUS_3_5]: 'Claude Opus 3.5',
  [AnthropicModel.CLAUDE_SONNET_3_5]: 'Claude Sonnet 3.5',
  [AnthropicModel.CLAUDE_HAIKU_3_5]: 'Claude Haiku 3.5',
  [AnthropicModel.CLAUDE_3_OPUS]: 'Claude 3 Opus',
  [AnthropicModel.CLAUDE_3_SONNET]: 'Claude 3 Sonnet',
  [AnthropicModel.CLAUDE_3_HAIKU]: 'Claude 3 Haiku',
};

/**
 * Get human-readable display name for a model
 *
 * @param model - The AnthropicModel enum value
 * @returns Display name for the model (e.g., "Claude Sonnet 4.5")
 *
 * @example
 * ```typescript
 * const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_4_5);
 * console.log(displayName); // "Claude Sonnet 4.5"
 * ```
 */
export const getModelDisplayName = (model: AnthropicModel): string => {
  return MODEL_DISPLAY_NAMES[model];
};

/**
 * Check if a string is a valid AnthropicModel identifier
 *
 * @param value - The string to check
 * @returns True if the value is a valid model identifier
 *
 * @example
 * ```typescript
 * isValidModel('claude-sonnet-4-5-20250929'); // true
 * isValidModel('invalid-model'); // false
 * ```
 */
export const isValidModel = (value: string): value is AnthropicModel => {
  return Object.values(AnthropicModel).includes(value as AnthropicModel);
};

/**
 * Get all available model identifiers
 *
 * @returns Array of all AnthropicModel enum values
 *
 * @example
 * ```typescript
 * const models = getAllModels();
 * console.log(models); // ['claude-opus-4-5-20251101', 'claude-sonnet-4-5-20250929', ...]
 * ```
 */
export const getAllModels = (): AnthropicModel[] => {
  return Object.values(AnthropicModel);
};

/**
 * Get model family (opus, sonnet, or haiku)
 *
 * @param model - The AnthropicModel enum value
 * @returns Model family name
 *
 * @example
 * ```typescript
 * getModelFamily(AnthropicModel.CLAUDE_SONNET_4_5); // 'sonnet'
 * getModelFamily(AnthropicModel.CLAUDE_OPUS_3_5); // 'opus'
 * ```
 */
export const getModelFamily = (model: AnthropicModel): 'opus' | 'sonnet' | 'haiku' => {
  const modelStr = model.toLowerCase();

  if (modelStr.includes('opus')) return 'opus';
  if (modelStr.includes('sonnet')) return 'sonnet';
  if (modelStr.includes('haiku')) return 'haiku';

  throw new Error(`Unknown model family for model: ${model}`);
};

/**
 * Transform Teams.ai messages to Anthropic message format
 *
 * @remarks
 * Handles conversion of user, model, and function messages.
 * System messages should be extracted separately using extractSystemMessage().
 *
 * Key transformations:
 * - role: 'user' → role: 'user'
 * - role: 'model' → role: 'assistant'
 * - role: 'function' → role: 'user' with tool_result
 * - function_calls → content: [{ type: 'tool_use', ... }]
 *
 * @param messages - Array of Teams.ai messages
 * @returns Array of Anthropic message parameters
 *
 * @throws Error if message has unsupported role or format
 */
export const transformToAnthropicMessages = (messages: Message[]): Anthropic.MessageParam[] => {
  const anthropicMessages: Anthropic.MessageParam[] = [];

  for (const message of messages) {
    // Skip system messages (handled separately)
    if (isSystemMessage(message)) {
      continue;
    }

    // User messages
    if (isUserMessage(message)) {
      // For now, only handle simple text content
      // Multi-part content (images) can be added in future updates
      anthropicMessages.push({
        role: 'user',
        content: typeof message.content === 'string' ? message.content : String(message.content),
      });
      continue;
    }

    // Model messages (assistant responses)
    if (isModelMessage(message)) {
      // If model message has function calls, convert to tool_use blocks
      if (message.function_calls && message.function_calls.length > 0) {
        const content: Array<Anthropic.TextBlock | Anthropic.ToolUseBlock> = [];

        // Add text content if present
        if (message.content) {
          content.push({
            type: 'text',
            text: message.content,
          } as Anthropic.TextBlock);
        }

        // Add tool_use blocks
        for (const fnCall of message.function_calls) {
          content.push({
            type: 'tool_use',
            id: fnCall.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: fnCall.name,
            input: fnCall.arguments as Record<string, unknown>,
          } as Anthropic.ToolUseBlock);
        }

        anthropicMessages.push({
          role: 'assistant',
          content,
        });
      } else {
        // Simple text response
        anthropicMessages.push({
          role: 'assistant',
          content: message.content || '',
        });
      }
      continue;
    }

    // Function messages (function results)
    if (isFunctionMessage(message)) {
      // Function messages represent results from tool executions
      // The 'name' property isn't available on FunctionMessage type
      // We'll use the content directly with a generated tool_use_id
      anthropicMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: `fn_${Date.now()}`, // Generate a tool_use_id
            content: message.content || '',
          } as Anthropic.ToolResultBlockParam,
        ],
      });
      continue;
    }

    // TypeScript exhaustive check - this should never be reached
    throw new Error(`Unsupported message role: ${(message as Message).role}`);
  }

  return anthropicMessages;
};

/**
 * Extract system message from Teams.ai conversation
 *
 * @remarks
 * Anthropic requires system messages to be provided separately from the
 * conversation messages array. This function extracts system content from
 * either SystemMessage or UserMessage with system role.
 *
 * @param messages - Array of Teams.ai messages
 * @returns System message content, or undefined if no system message found
 *
 * @example
 * ```typescript
 * const systemPrompt = extractSystemMessage(messages);
 * const apiParams = {
 *   system: systemPrompt,
 *   messages: transformToAnthropicMessages(messages),
 * };
 * ```
 */
export const extractSystemMessage = (messages: Message[]): string | undefined => {
  for (const message of messages) {
    if (isSystemMessage(message)) {
      return message.content;
    }
  }

  return undefined;
};

/**
 * Transform Anthropic response to Teams.ai ModelMessage format
 *
 * @remarks
 * Handles conversion of assistant responses with text and tool use.
 *
 * Key transformations:
 * - Extracts text from content blocks
 * - Converts tool_use blocks to function_calls array
 * - role: 'assistant' → role: 'model'
 *
 * @param response - Anthropic message response
 * @returns Teams.ai ModelMessage
 *
 * @example
 * ```typescript
 * const anthropicResponse = await client.messages.create({ ... });
 * const modelMessage = transformFromAnthropicMessage(anthropicResponse);
 * ```
 */
export const transformFromAnthropicMessage = (response: Anthropic.Message): ModelMessage => {
  const modelMessage: ModelMessage = {
    role: 'model',
    content: '',
  };

  // Extract text and tool use from content blocks
  const textParts: string[] = [];
  const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

  for (const block of response.content) {
    if (block.type === 'text') {
      textParts.push(block.text);
    } else if (block.type === 'tool_use') {
      toolUses.push({
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    }
  }

  // Set text content
  modelMessage.content = textParts.join('');

  // Convert tool uses to function_calls
  if (toolUses.length > 0) {
    modelMessage.function_calls = toolUses.map((tool) => ({
      id: tool.id,
      name: tool.name,
      arguments: tool.input as { [key: string]: unknown },
    }));
  }

  return modelMessage;
};
