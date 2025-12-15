import type Anthropic from '@anthropic-ai/sdk';
import type { ILogger } from '@microsoft/teams.common';
import type { AnthropicModel } from './teams-anthropic.utils.ts';

/**
 * Configuration options for AnthropicChatModel
 *
 * @remarks
 * All options are readonly to prevent accidental mutation.
 * API key defaults to ANTHROPIC_API_KEY environment variable if not provided.
 *
 * @example
 * ```typescript
 * const options: AnthropicChatModelOptions = {
 *   model: AnthropicModel.CLAUDE_SONNET_4_5,
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   timeout: 60_000,
 *   requestOptions: {
 *     max_tokens: 4096,
 *     temperature: 0.7,
 *   },
 * };
 * ```
 */
export type AnthropicChatModelOptions = {
  /**
   * The Claude model to use (type-safe enum)
   *
   * @example AnthropicModel.CLAUDE_SONNET_4_5
   */
  readonly model: AnthropicModel;

  /**
   * Anthropic API key
   *
   * @remarks
   * Defaults to ANTHROPIC_API_KEY environment variable if not provided
   *
   * @example process.env.ANTHROPIC_API_KEY
   */
  readonly apiKey?: string;

  /**
   * Base URL for Anthropic API
   *
   * @remarks
   * Use this for proxies or custom endpoints
   *
   * @default 'https://api.anthropic.com'
   */
  readonly baseUrl?: string;

  /**
   * Custom headers to include in API requests
   *
   * @example { 'X-Custom-Header': 'value' }
   */
  readonly headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   *
   * @default 60_000 (60 seconds)
   */
  readonly timeout?: number;

  /**
   * Default request options for Anthropic API calls
   *
   * @remarks
   * These options are merged with per-request options in send()
   * Fields managed by send() (model, messages, system, stream, tools) are omitted
   *
   * @example
   * ```typescript
   * requestOptions: {
   *   max_tokens: 4096,
   *   temperature: 0.7,
   *   top_p: 0.9,
   * }
   * ```
   */
  readonly requestOptions?: AnthropicRequestOptions;

  /**
   * Logger for debugging and monitoring
   *
   * @remarks
   * Uses Teams.ai ILogger interface for consistency
   */
  readonly logger?: ILogger;
};

/**
 * Anthropic API request parameters with managed fields omitted
 *
 * @remarks
 * Omits fields that are managed by the send() method:
 * - model: Set from constructor options
 * - messages: Built from conversation history
 * - system: Extracted from conversation
 * - stream: Determined by onChunk callback presence
 * - tools: Built from options.functions
 *
 * This allows users to set other parameters like max_tokens, temperature, etc.
 * without conflicting with the IChatModel interface.
 *
 * @example
 * ```typescript
 * const requestOptions: AnthropicRequestOptions = {
 *   max_tokens: 4096,
 *   temperature: 0.7,
 *   top_k: 40,
 *   top_p: 0.9,
 *   metadata: {
 *     user_id: 'user-123',
 *   },
 * };
 * ```
 */
export type AnthropicRequestOptions = Omit<
  Anthropic.MessageCreateParams,
  'model' | 'messages' | 'system' | 'stream' | 'tools'
>;
