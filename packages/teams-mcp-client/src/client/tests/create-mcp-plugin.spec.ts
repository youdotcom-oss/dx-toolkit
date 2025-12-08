// Unit tests for createMcpPlugin factory function

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { DEFAULT_DEBUG, DEFAULT_MCP_URL, DEFAULT_TIMEOUT } from '../../config/defaults.ts';
import { ErrorCodes, McpPluginError } from '../../errors/error-handler.ts';
import { createMcpPlugin } from '../create-mcp-plugin.ts';

describe('createMcpPlugin', () => {
  const originalEnv = process.env.YDC_API_KEY;

  beforeEach(() => {
    // Set up environment variable for tests
    process.env.YDC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv) {
      process.env.YDC_API_KEY = originalEnv;
    } else {
      delete process.env.YDC_API_KEY;
    }
  });

  test('creates plugin with default configuration', () => {
    const result = createMcpPlugin();

    expect(result).toBeDefined();
    expect(result.plugin).toBeDefined();
    expect(result.config).toBeDefined();
  });

  test('creates plugin with user configuration', () => {
    const config = {
      apiKey: 'custom-api-key',
      timeout: 60000,
      debug: true,
    };

    const result = createMcpPlugin(config);

    expect(result.plugin).toBeDefined();
    expect(result.config.apiKey).toBe('custom-api-key');
    expect(result.config.timeout).toBe(60000);
    expect(result.config.debug).toBe(true);
  });

  test('uses default MCP URL when not provided', () => {
    const result = createMcpPlugin();

    expect(result.config.mcpUrl).toBe(DEFAULT_MCP_URL);
  });

  test('uses custom MCP URL when provided', () => {
    const config = {
      apiKey: 'test-key',
      mcpUrl: 'https://custom.example.com/mcp',
    };

    const result = createMcpPlugin(config);

    expect(result.config.mcpUrl).toBe('https://custom.example.com/mcp');
  });

  test('includes Authorization header with Bearer token', () => {
    const config = {
      apiKey: 'test-api-key',
    };

    const result = createMcpPlugin(config);

    expect(result.config).toHaveProperty('params');
    expect(result.config.params).toHaveProperty('headers');
    expect(result.config.params.headers.Authorization).toBe('Bearer test-api-key');
  });

  test('merges custom headers with defaults', () => {
    const config = {
      apiKey: 'test-key',
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    };

    const result = createMcpPlugin(config);

    expect(result.config.params.headers.Authorization).toBe('Bearer test-key');
    expect(result.config.params.headers['X-Custom-Header']).toBe('custom-value');
  });

  test('uses API key from environment variable', () => {
    process.env.YDC_API_KEY = 'env-api-key';

    const result = createMcpPlugin();

    expect(result.config.params.headers.Authorization).toBe('Bearer env-api-key');
  });

  test('prefers config API key over environment variable', () => {
    process.env.YDC_API_KEY = 'env-key';

    const config = {
      apiKey: 'config-key',
    };

    const result = createMcpPlugin(config);

    expect(result.config.params.headers.Authorization).toBe('Bearer config-key');
  });

  test('throws McpPluginError when API key is missing', () => {
    delete process.env.YDC_API_KEY;

    expect(() => {
      createMcpPlugin();
    }).toThrow(McpPluginError);

    expect(() => {
      createMcpPlugin();
    }).toThrow('API key is required');
  });

  test('throws McpPluginError with correct error code for configuration failure', () => {
    delete process.env.YDC_API_KEY;

    try {
      createMcpPlugin();
    } catch (err) {
      expect(err).toBeInstanceOf(McpPluginError);
      expect((err as McpPluginError).code).toBe(ErrorCodes.PLUGIN_CREATION_FAILED);
    }
  });

  test('throws error for invalid configuration', () => {
    const config = {
      apiKey: 'test-key',
      timeout: -1000, // Invalid: negative timeout
    };

    expect(() => {
      createMcpPlugin(config);
    }).toThrow(McpPluginError);

    expect(() => {
      createMcpPlugin(config);
    }).toThrow('Invalid configuration');
  });

  test('throws error for invalid MCP URL', () => {
    const config = {
      apiKey: 'test-key',
      mcpUrl: 'not-a-valid-url',
    };

    expect(() => {
      createMcpPlugin(config);
    }).toThrow(McpPluginError);
  });

  test('includes timeout in config params', () => {
    const config = {
      apiKey: 'test-key',
      timeout: 45000,
    };

    const result = createMcpPlugin(config);

    expect(result.config.params.timeout).toBe(45000);
  });

  test('uses default timeout when not provided', () => {
    const result = createMcpPlugin();

    expect(result.config.timeout).toBe(DEFAULT_TIMEOUT);
  });

  test('uses default debug mode when not provided', () => {
    const result = createMcpPlugin();

    expect(result.config.debug).toBe(DEFAULT_DEBUG);
  });

  test('returns plugin and config in result', () => {
    const result = createMcpPlugin();

    expect(result).toHaveProperty('plugin');
    expect(result).toHaveProperty('config');
    expect(typeof result.plugin).toBe('object');
    expect(typeof result.config).toBe('object');
  });

  test('config includes url property for Teams AI usePlugin', () => {
    const result = createMcpPlugin();

    expect(result.config).toHaveProperty('url');
    expect(result.config.url).toBe(DEFAULT_MCP_URL);
  });

  test('handles empty config object', () => {
    const result = createMcpPlugin({});

    expect(result.plugin).toBeDefined();
    expect(result.config.apiKey).toBe('test-api-key'); // From env
  });
});
