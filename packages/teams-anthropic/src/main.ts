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
export { AnthropicChatModel } from './chat-model.ts';
// Types
export type { AnthropicChatModelOptions, AnthropicRequestOptions } from './teams-anthropic.types.ts';
// Model enum and helpers
export {
  AnthropicModel,
  extractSystemMessage,
  getAllModels,
  getModelDisplayName,
  getModelFamily,
  isValidModel,
  transformFromAnthropicMessage,
  transformToAnthropicMessages,
} from './teams-anthropic.utils.ts';
