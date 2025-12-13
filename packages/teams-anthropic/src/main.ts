/**
 * @youdotcom-oss/teams-anthropic
 *
 * Anthropic SDK integration for Microsoft Teams.ai
 *
 * This package enables Claude models (Opus, Sonnet, Haiku) to be used in
 * Microsoft Teams.ai applications through the IChatModel interface.
 *
 * @example
 * ```typescript
 * import { AnthropicChatModel, AnthropicModel } from '@youdotcom-oss/teams-anthropic';
 *
 * const model = new AnthropicChatModel({
 *   model: AnthropicModel.CLAUDE_SONNET_4_5,
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 * });
 *
 * const response = await model.send(
 *   { role: 'user', content: 'Hello!' }
 * );
 * ```
 *
 * @packageDocumentation
 */

// Core class
export { AnthropicChatModel } from './models/anthropic-chat-model.ts';

// Model enum and helpers
export {
  AnthropicModel,
  getAllModels,
  getModelDisplayName,
  getModelFamily,
  isValidModel,
} from './models/anthropic-model.enum.ts';

// Types
export type { AnthropicChatModelOptions, AnthropicRequestOptions } from './types/options.ts';

// Utils (for advanced users)
export {
  extractSystemMessage,
  transformFromAnthropicMessage,
  transformToAnthropicMessages,
} from './utils/message-transformer.ts';
