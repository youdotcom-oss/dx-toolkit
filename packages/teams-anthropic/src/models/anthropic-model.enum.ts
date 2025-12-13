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
