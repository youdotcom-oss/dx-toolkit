import { describe, expect, it } from 'bun:test';
import {
  AnthropicModel,
  getAllModels,
  getModelDisplayName,
  getModelFamily,
  isValidModel,
} from '../models/anthropic-model.enum.ts';

describe('anthropic-model.enum', () => {
  describe('AnthropicModel enum', () => {
    it('should have correct model identifiers', () => {
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
    it('should return correct display name for Claude Opus 4.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(displayName).toBe('Claude Opus 4.5');
    });

    it('should return correct display name for Claude Sonnet 4.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_4_5);
      expect(displayName).toBe('Claude Sonnet 4.5');
    });

    it('should return correct display name for Claude Opus 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_OPUS_3_5);
      expect(displayName).toBe('Claude Opus 3.5');
    });

    it('should return correct display name for Claude Sonnet 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_SONNET_3_5);
      expect(displayName).toBe('Claude Sonnet 3.5');
    });

    it('should return correct display name for Claude Haiku 3.5', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_HAIKU_3_5);
      expect(displayName).toBe('Claude Haiku 3.5');
    });

    it('should return correct display name for Claude 3 Opus', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_OPUS);
      expect(displayName).toBe('Claude 3 Opus');
    });

    it('should return correct display name for Claude 3 Sonnet', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_SONNET);
      expect(displayName).toBe('Claude 3 Sonnet');
    });

    it('should return correct display name for Claude 3 Haiku', () => {
      const displayName = getModelDisplayName(AnthropicModel.CLAUDE_3_HAIKU);
      expect(displayName).toBe('Claude 3 Haiku');
    });
  });

  describe('isValidModel', () => {
    it('should return true for valid Claude Opus 4.5', () => {
      expect(isValidModel('claude-opus-4-5-20251101')).toBe(true);
    });

    it('should return true for valid Claude Sonnet 4.5', () => {
      expect(isValidModel('claude-sonnet-4-5-20250929')).toBe(true);
    });

    it('should return true for valid Claude Opus 3.5', () => {
      expect(isValidModel('claude-opus-3-5-20240229')).toBe(true);
    });

    it('should return true for valid Claude Sonnet 3.5', () => {
      expect(isValidModel('claude-3-5-sonnet-20241022')).toBe(true);
    });

    it('should return true for valid Claude Haiku 3.5', () => {
      expect(isValidModel('claude-3-5-haiku-20241022')).toBe(true);
    });

    it('should return true for valid Claude 3 Opus', () => {
      expect(isValidModel('claude-3-opus-20240229')).toBe(true);
    });

    it('should return true for valid Claude 3 Sonnet', () => {
      expect(isValidModel('claude-3-sonnet-20240229')).toBe(true);
    });

    it('should return true for valid Claude 3 Haiku', () => {
      expect(isValidModel('claude-3-haiku-20240307')).toBe(true);
    });

    it('should return false for invalid model identifier', () => {
      expect(isValidModel('invalid-model-id')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidModel('')).toBe(false);
    });

    it('should return false for similar but incorrect identifier', () => {
      expect(isValidModel('claude-sonnet-4-5')).toBe(false);
    });
  });

  describe('getAllModels', () => {
    it('should return all model enum values', () => {
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

    it('should return array of valid model identifiers', () => {
      const allModels = getAllModels();

      for (const model of allModels) {
        expect(isValidModel(model)).toBe(true);
      }
    });
  });

  describe('getModelFamily', () => {
    it('should return "opus" for Opus 4.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(family).toBe('opus');
    });

    it('should return "sonnet" for Sonnet 4.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_SONNET_4_5);
      expect(family).toBe('sonnet');
    });

    it('should return "opus" for Opus 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_3_5);
      expect(family).toBe('opus');
    });

    it('should return "sonnet" for Sonnet 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_SONNET_3_5);
      expect(family).toBe('sonnet');
    });

    it('should return "haiku" for Haiku 3.5', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_HAIKU_3_5);
      expect(family).toBe('haiku');
    });

    it('should return "opus" for Claude 3 Opus', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_OPUS);
      expect(family).toBe('opus');
    });

    it('should return "sonnet" for Claude 3 Sonnet', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_SONNET);
      expect(family).toBe('sonnet');
    });

    it('should return "haiku" for Claude 3 Haiku', () => {
      const family = getModelFamily(AnthropicModel.CLAUDE_3_HAIKU);
      expect(family).toBe('haiku');
    });

    it('should handle case insensitivity', () => {
      // Test that the function works with lowercase model strings
      const family = getModelFamily(AnthropicModel.CLAUDE_OPUS_4_5);
      expect(family).toBe('opus');
    });
  });
});
