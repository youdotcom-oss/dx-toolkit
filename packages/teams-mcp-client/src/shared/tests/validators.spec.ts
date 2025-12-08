// Unit tests for validation schemas

import { describe, expect, test } from 'bun:test';
import { McpPluginConfigSchema } from '../validators.ts';

describe('McpPluginConfigSchema', () => {
	test('validates valid minimal config', () => {
		const config = {
			apiKey: 'test-api-key',
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	test('validates valid full config', () => {
		const config = {
			apiKey: 'test-api-key',
			mcpUrl: 'https://api.you.com/mcp',
			headers: { 'X-Custom': 'value' },
			timeout: 30000,
			debug: true,
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	test('validates empty config', () => {
		const config = {};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	test('rejects empty API key', () => {
		const config = {
			apiKey: '',
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects invalid MCP URL', () => {
		const config = {
			mcpUrl: 'not-a-valid-url',
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects invalid headers', () => {
		const config = {
			headers: { key: 123 }, // Should be string values
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects negative timeout', () => {
		const config = {
			timeout: -1000,
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects zero timeout', () => {
		const config = {
			timeout: 0,
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects timeout exceeding max', () => {
		const config = {
			timeout: 400000, // Exceeds 5 minutes (300000ms)
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects non-integer timeout', () => {
		const config = {
			timeout: 30000.5,
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects invalid debug type', () => {
		const config = {
			debug: 'true', // Should be boolean
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	test('rejects extra fields with strict mode', () => {
		const config = {
			apiKey: 'test-key',
			extraField: 'not-allowed',
		};

		const result = McpPluginConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});
});
