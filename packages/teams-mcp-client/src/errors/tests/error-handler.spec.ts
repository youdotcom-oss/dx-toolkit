// Unit tests for error handling utilities

import { describe, expect, test } from 'bun:test';
import { ErrorCodes, McpPluginError, wrapError } from '../error-handler.ts';

describe('McpPluginError', () => {
	test('creates error with message', () => {
		const error = new McpPluginError('Test error message');

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(McpPluginError);
		expect(error.message).toBe('Test error message');
		expect(error.name).toBe('McpPluginError');
		expect(error.code).toBeUndefined();
	});

	test('creates error with message and code', () => {
		const error = new McpPluginError('Test error', ErrorCodes.INVALID_CONFIG);

		expect(error.message).toBe('Test error');
		expect(error.code).toBe(ErrorCodes.INVALID_CONFIG);
	});

	test('captures stack trace', () => {
		const error = new McpPluginError('Test error');

		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('McpPluginError');
	});
});

describe('wrapError', () => {
	test('returns McpPluginError as-is', () => {
		const originalError = new McpPluginError('Original error', ErrorCodes.TIMEOUT);

		const result = wrapError(originalError);

		expect(result).toBe(originalError);
		expect(result.message).toBe('Original error');
		expect(result.code).toBe(ErrorCodes.TIMEOUT);
	});

	test('wraps standard Error with message', () => {
		const originalError = new Error('Standard error');

		const result = wrapError(originalError);

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Standard error');
		expect(result.code).toBeUndefined();
	});

	test('wraps standard Error with context', () => {
		const originalError = new Error('Original message');

		const result = wrapError(originalError, 'Operation failed');

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Operation failed: Original message');
	});

	test('wraps string error', () => {
		const result = wrapError('String error message');

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Unknown error: String error message');
	});

	test('wraps string error with context', () => {
		const result = wrapError('String error', 'Context');

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Context: String error');
	});

	test('wraps number error', () => {
		const result = wrapError(404);

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Unknown error: 404');
	});

	test('wraps null error', () => {
		const result = wrapError(null);

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Unknown error: null');
	});

	test('wraps undefined error', () => {
		const result = wrapError(undefined);

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toBe('Unknown error: undefined');
	});

	test('wraps object error', () => {
		const result = wrapError({ code: 500, status: 'error' });

		expect(result).toBeInstanceOf(McpPluginError);
		expect(result.message).toContain('Unknown error');
	});

	test('preserves error information in wrapped error', () => {
		const originalError = new TypeError('Type mismatch');

		const result = wrapError(originalError, 'Validation failed');

		expect(result.message).toBe('Validation failed: Type mismatch');
	});
});

describe('ErrorCodes', () => {
	test('has all expected error codes', () => {
		expect(ErrorCodes.INVALID_CONFIG).toBe('INVALID_CONFIG');
		expect(ErrorCodes.MISSING_API_KEY).toBe('MISSING_API_KEY');
		expect(ErrorCodes.PLUGIN_CREATION_FAILED).toBe('PLUGIN_CREATION_FAILED');
		expect(ErrorCodes.CONNECTION_FAILED).toBe('CONNECTION_FAILED');
		expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
	});

	test('has correct type', () => {
		const code: string = ErrorCodes.TIMEOUT;
		expect(code).toBe('TIMEOUT');
	});
});
