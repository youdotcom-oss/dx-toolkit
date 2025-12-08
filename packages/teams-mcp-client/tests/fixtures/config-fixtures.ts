// Test fixtures for configuration testing

import type { McpPluginConfig } from '../../src/client/types.ts';

/**
 * Valid minimal configuration
 */
export const validMinimalConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-api-key-12345',
};

/**
 * Valid full configuration with all options
 */
export const validFullConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-api-key-full-67890',
  mcpUrl: 'https://api.you.com/mcp',
  headers: {
    'X-Custom-Header': 'custom-value',
    'X-Another-Header': 'another-value',
  },
  timeout: 45000,
  debug: true,
};

/**
 * Configuration with custom MCP URL
 */
export const customUrlConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-api-key',
  mcpUrl: 'https://custom.example.com/mcp',
};

/**
 * Configuration with only headers
 */
export const headersOnlyConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  headers: {
    'X-Test-Header': 'test-value',
  },
};

/**
 * Configuration with extended timeout
 */
export const extendedTimeoutConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  timeout: 120000, // 2 minutes
};

/**
 * Invalid configuration: empty API key
 */
export const invalidEmptyApiKey: Partial<McpPluginConfig> = {
  apiKey: '',
};

/**
 * Invalid configuration: negative timeout
 */
export const invalidNegativeTimeout: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  timeout: -5000,
};

/**
 * Invalid configuration: timeout exceeds max
 */
export const invalidTimeoutExceedsMax: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  timeout: 400000, // Exceeds 5 minutes (300000ms)
};

/**
 * Invalid configuration: invalid URL
 */
export const invalidUrlConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  mcpUrl: 'not-a-valid-url',
};

/**
 * Configuration with debug enabled
 */
export const debugEnabledConfig: Partial<McpPluginConfig> = {
  apiKey: 'test-key',
  debug: true,
};
