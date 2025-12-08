// Unit tests for configuration management

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mergeConfig } from '../config.ts';
import { DEFAULT_DEBUG, DEFAULT_MCP_URL, DEFAULT_TIMEOUT } from '../defaults.ts';

describe('mergeConfig', () => {
	const originalEnv = process.env.YDC_API_KEY;

	beforeEach(() => {
		// Clear environment variable before each test
		delete process.env.YDC_API_KEY;
	});

	afterEach(() => {
		// Restore original environment variable
		if (originalEnv) {
			process.env.YDC_API_KEY = originalEnv;
		} else {
			delete process.env.YDC_API_KEY;
		}
	});

	test('merges user config with defaults', () => {
		const userConfig = {
			apiKey: 'test-api-key',
			timeout: 60000,
		};

		const result = mergeConfig(userConfig);

		expect(result.apiKey).toBe('test-api-key');
		expect(result.mcpUrl).toBe(DEFAULT_MCP_URL);
		expect(result.timeout).toBe(60000);
		expect(result.debug).toBe(DEFAULT_DEBUG);
	});

	test('uses all user-provided values', () => {
		const userConfig = {
			apiKey: 'test-api-key',
			mcpUrl: 'https://custom.example.com/mcp',
			headers: { 'X-Custom': 'value' },
			timeout: 45000,
			debug: true,
		};

		const result = mergeConfig(userConfig);

		expect(result.apiKey).toBe('test-api-key');
		expect(result.mcpUrl).toBe('https://custom.example.com/mcp');
		expect(result.headers).toEqual({ 'X-Custom': 'value' });
		expect(result.timeout).toBe(45000);
		expect(result.debug).toBe(true);
	});

	test('uses API key from environment variable', () => {
		process.env.YDC_API_KEY = 'env-api-key';

		const result = mergeConfig();

		expect(result.apiKey).toBe('env-api-key');
		expect(result.mcpUrl).toBe(DEFAULT_MCP_URL);
	});

	test('prefers config API key over environment variable', () => {
		process.env.YDC_API_KEY = 'env-api-key';

		const userConfig = {
			apiKey: 'config-api-key',
		};

		const result = mergeConfig(userConfig);

		expect(result.apiKey).toBe('config-api-key');
	});

	test('throws error if API key is missing', () => {
		expect(() => {
			mergeConfig();
		}).toThrow('API key is required');
	});

	test('throws error for invalid configuration', () => {
		const userConfig = {
			apiKey: 'test-key',
			timeout: -1000, // Invalid: negative timeout
		};

		expect(() => {
			mergeConfig(userConfig);
		}).toThrow('Invalid configuration');
	});

	test('throws error for invalid MCP URL', () => {
		const userConfig = {
			apiKey: 'test-key',
			mcpUrl: 'not-a-valid-url',
		};

		expect(() => {
			mergeConfig(userConfig);
		}).toThrow('Invalid configuration');
	});

	test('merges headers with defaults', () => {
		const userConfig = {
			apiKey: 'test-key',
			headers: { 'X-Custom-1': 'value1', 'X-Custom-2': 'value2' },
		};

		const result = mergeConfig(userConfig);

		expect(result.headers).toEqual({
			'X-Custom-1': 'value1',
			'X-Custom-2': 'value2',
		});
	});

	test('uses all defaults when no config provided', () => {
		process.env.YDC_API_KEY = 'env-api-key';

		const result = mergeConfig();

		expect(result.apiKey).toBe('env-api-key');
		expect(result.mcpUrl).toBe(DEFAULT_MCP_URL);
		expect(result.timeout).toBe(DEFAULT_TIMEOUT);
		expect(result.debug).toBe(DEFAULT_DEBUG);
		expect(result.headers).toEqual({});
	});

	test('handles empty user config object', () => {
		process.env.YDC_API_KEY = 'env-api-key';

		const result = mergeConfig({});

		expect(result.apiKey).toBe('env-api-key');
		expect(result.mcpUrl).toBe(DEFAULT_MCP_URL);
	});

	test('throws error for empty API key string', () => {
		const userConfig = {
			apiKey: '',
		};

		expect(() => {
			mergeConfig(userConfig);
		}).toThrow('Invalid configuration');
	});
});
