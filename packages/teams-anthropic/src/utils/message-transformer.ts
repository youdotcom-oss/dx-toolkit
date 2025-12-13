import type Anthropic from '@anthropic-ai/sdk';
import type { FunctionMessage, Message, ModelMessage, SystemMessage, UserMessage } from '@microsoft/teams.ai';

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
    if (message.role === 'system') {
      continue;
    }

    // User messages
    if (message.role === 'user') {
      const userMsg = message as UserMessage;

      // For now, only handle simple text content
      // Multi-part content (images) can be added in future updates
      anthropicMessages.push({
        role: 'user',
        content: typeof userMsg.content === 'string' ? userMsg.content : String(userMsg.content),
      });
      continue;
    }

    // Model messages (assistant responses)
    if (message.role === 'model') {
      const modelMsg = message as ModelMessage;

      // If model message has function calls, convert to tool_use blocks
      if (modelMsg.function_calls && modelMsg.function_calls.length > 0) {
        const content: Array<Anthropic.TextBlock | Anthropic.ToolUseBlock> = [];

        // Add text content if present
        if (modelMsg.content) {
          content.push({
            type: 'text',
            text: modelMsg.content,
          } as Anthropic.TextBlock);
        }

        // Add tool_use blocks
        for (const fnCall of modelMsg.function_calls) {
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
          content: modelMsg.content || '',
        });
      }
      continue;
    }

    // Function messages (function results)
    if (message.role === 'function') {
      const fnMsg = message as FunctionMessage;

      // Function messages represent results from tool executions
      // The 'name' property isn't available on FunctionMessage type
      // We'll use the content directly with a generated tool_use_id
      anthropicMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: `fn_${Date.now()}`, // Generate a tool_use_id
            content: fnMsg.content || '',
          } as Anthropic.ToolResultBlockParam,
        ],
      });
      continue;
    }

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
    if (message.role === 'system') {
      const systemMsg = message as SystemMessage;
      return systemMsg.content;
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
