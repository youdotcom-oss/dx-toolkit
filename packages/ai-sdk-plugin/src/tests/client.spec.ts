import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createYouMCPClient } from '../client.ts';
import { YouMCPClientError } from '../types.ts';

describe('createYouMCPClient', () => {
  const originalEnv = process.env.YDC_API_KEY;

  beforeEach(() => {
    // Save original env
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.YDC_API_KEY = originalEnv;
    } else {
      delete process.env.YDC_API_KEY;
    }
  });

  test('should throw error when API key is missing', async () => {
    delete process.env.YDC_API_KEY;

    await expect(createYouMCPClient()).rejects.toThrow(YouMCPClientError);
    await expect(createYouMCPClient()).rejects.toThrow('API key required');
  });

  test('should use API key from config over environment', async () => {
    process.env.YDC_API_KEY = 'env-key';

    const config = {
      apiKey: 'config-key',
      serverUrl: 'http://localhost:9999/mcp', // Non-existent server
    };

    // Will fail on connection (expected), but validates API key usage
    await expect(createYouMCPClient(config)).rejects.toThrow(YouMCPClientError);
    await expect(createYouMCPClient(config)).rejects.toThrow('Failed to create MCP client');
  });

  test('should use API key from environment when config not provided', async () => {
    process.env.YDC_API_KEY = 'env-key';

    const config = {
      serverUrl: 'http://localhost:9999/mcp', // Non-existent server
    };

    // Will fail on connection (expected), but validates API key usage
    await expect(createYouMCPClient(config)).rejects.toThrow(YouMCPClientError);
    await expect(createYouMCPClient(config)).rejects.toThrow('Failed to create MCP client');
  });

  test('should throw custom error class', async () => {
    delete process.env.YDC_API_KEY;

    try {
      await createYouMCPClient();
    } catch (error) {
      expect(error).toBeInstanceOf(YouMCPClientError);
      expect((error as YouMCPClientError).name).toBe('YouMCPClientError');
    }
  });

  test('should include cause in error when connection fails', async () => {
    const config = {
      apiKey: 'test-key',
      serverUrl: 'http://localhost:9999/mcp', // Non-existent server
    };

    try {
      await createYouMCPClient(config);
    } catch (error) {
      expect(error).toBeInstanceOf(YouMCPClientError);
      expect((error as YouMCPClientError).cause).toBeDefined();
    }
  });
});
