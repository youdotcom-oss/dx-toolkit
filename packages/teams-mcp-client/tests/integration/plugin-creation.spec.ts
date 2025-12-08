// Integration tests for plugin creation workflow

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createMcpPlugin } from '../../src/client/create-mcp-plugin.ts';
import { McpPluginError } from '../../src/errors/error-handler.ts';
import {
  customUrlConfig,
  debugEnabledConfig,
  extendedTimeoutConfig,
  headersOnlyConfig,
  invalidEmptyApiKey,
  invalidNegativeTimeout,
  invalidTimeoutExceedsMax,
  invalidUrlConfig,
  validFullConfig,
  validMinimalConfig,
} from '../fixtures/config-fixtures.ts';

describe('Plugin Creation Integration', () => {
  const originalEnv = process.env.YDC_API_KEY;

  beforeEach(() => {
    // Set up test environment
    process.env.YDC_API_KEY = 'integration-test-key';
  });

  afterEach(() => {
    // Clean up
    if (originalEnv) {
      process.env.YDC_API_KEY = originalEnv;
    } else {
      delete process.env.YDC_API_KEY;
    }
  });

  describe('Successful Plugin Creation', () => {
    test('creates plugin with minimal configuration', () => {
      const result = createMcpPlugin(validMinimalConfig);

      expect(result).toBeDefined();
      expect(result.plugin).toBeDefined();
      expect(result.config).toBeDefined();
      // biome-ignore lint/style/noNonNullAssertion: Test fixture value is known to be defined
      expect(result.config.apiKey).toBe(validMinimalConfig.apiKey!);
    });

    test('creates plugin with full configuration', () => {
      const result = createMcpPlugin(validFullConfig);

      expect(result.plugin).toBeDefined();
      // biome-ignore lint/style/noNonNullAssertion: Test fixture values are known to be defined
      expect(result.config.apiKey).toBe(validFullConfig.apiKey!);
      // biome-ignore lint/style/noNonNullAssertion: Test fixture values are known to be defined
      expect(result.config.mcpUrl).toBe(validFullConfig.mcpUrl!);
      // biome-ignore lint/style/noNonNullAssertion: Test fixture values are known to be defined
      expect(result.config.timeout).toBe(validFullConfig.timeout!);
      // biome-ignore lint/style/noNonNullAssertion: Test fixture values are known to be defined
      expect(result.config.debug).toBe(validFullConfig.debug!);
    });

    test('creates plugin with custom URL', () => {
      const result = createMcpPlugin(customUrlConfig);

      // biome-ignore lint/style/noNonNullAssertion: Test fixture value is known to be defined
      expect(result.config.url).toBe(customUrlConfig.mcpUrl!);
      // biome-ignore lint/style/noNonNullAssertion: Test fixture value is known to be defined
      expect(result.config.mcpUrl).toBe(customUrlConfig.mcpUrl!);
    });

    test('creates plugin with custom headers', () => {
      const result = createMcpPlugin(headersOnlyConfig);

      expect(result.config.params.headers).toHaveProperty('X-Test-Header');
      expect(result.config.params.headers['X-Test-Header']).toBe('test-value');
      expect(result.config.params.headers.Authorization).toContain('Bearer');
    });

    test('creates plugin with extended timeout', () => {
      const result = createMcpPlugin(extendedTimeoutConfig);

      expect(result.config.timeout).toBe(120000);
      expect(result.config.params.timeout).toBe(120000);
    });

    test('creates plugin using environment variable', () => {
      process.env.YDC_API_KEY = 'env-test-key';

      const result = createMcpPlugin();

      expect(result.config.apiKey).toBe('env-test-key');
      expect(result.config.params.headers.Authorization).toBe('Bearer env-test-key');
    });
  });

  describe('Plugin Configuration Properties', () => {
    test('plugin result includes all required properties', () => {
      const result = createMcpPlugin(validMinimalConfig);

      expect(result).toHaveProperty('plugin');
      expect(result).toHaveProperty('config');
      expect(result.config).toHaveProperty('apiKey');
      expect(result.config).toHaveProperty('mcpUrl');
      expect(result.config).toHaveProperty('url');
      expect(result.config).toHaveProperty('params');
      expect(result.config).toHaveProperty('timeout');
      expect(result.config).toHaveProperty('debug');
    });

    test('config params include authorization header', () => {
      const result = createMcpPlugin(validMinimalConfig);

      expect(result.config.params.headers).toHaveProperty('Authorization');
      expect(result.config.params.headers.Authorization).toMatch(/^Bearer /);
    });

    test('config url matches mcpUrl', () => {
      const result = createMcpPlugin(validFullConfig);

      expect(result.config.url).toBe(result.config.mcpUrl);
    });
  });

  describe('Error Handling', () => {
    test('throws error for missing API key', () => {
      delete process.env.YDC_API_KEY;

      expect(() => {
        createMcpPlugin();
      }).toThrow(McpPluginError);

      expect(() => {
        createMcpPlugin();
      }).toThrow('API key is required');
    });

    test('throws error for empty API key', () => {
      expect(() => {
        createMcpPlugin(invalidEmptyApiKey);
      }).toThrow(McpPluginError);
    });

    test('throws error for negative timeout', () => {
      expect(() => {
        createMcpPlugin(invalidNegativeTimeout);
      }).toThrow(McpPluginError);

      expect(() => {
        createMcpPlugin(invalidNegativeTimeout);
      }).toThrow('Invalid configuration');
    });

    test('throws error for timeout exceeding max', () => {
      expect(() => {
        createMcpPlugin(invalidTimeoutExceedsMax);
      }).toThrow(McpPluginError);
    });

    test('throws error for invalid URL', () => {
      expect(() => {
        createMcpPlugin(invalidUrlConfig);
      }).toThrow(McpPluginError);
    });
  });

  describe('Environment Variable Behavior', () => {
    test('prefers explicit config over environment variable', () => {
      process.env.YDC_API_KEY = 'env-key';

      const result = createMcpPlugin({
        apiKey: 'config-key',
      });

      expect(result.config.apiKey).toBe('config-key');
      expect(result.config.params.headers.Authorization).toBe('Bearer config-key');
    });

    test('falls back to environment variable when no config provided', () => {
      process.env.YDC_API_KEY = 'env-fallback-key';

      const result = createMcpPlugin({});

      expect(result.config.apiKey).toBe('env-fallback-key');
    });
  });

  describe('Debug Mode', () => {
    test('debug mode is disabled by default', () => {
      const result = createMcpPlugin(validMinimalConfig);

      expect(result.config.debug).toBe(false);
    });

    test('debug mode can be enabled', () => {
      const result = createMcpPlugin(debugEnabledConfig);

      expect(result.config.debug).toBe(true);
    });
  });
});
