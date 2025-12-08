// Error handling utilities for teams-mcp-client

/**
 * Custom error class for MCP plugin errors
 */
export class McpPluginError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'McpPluginError';

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, McpPluginError);
    }
  }
}

/**
 * Wraps unknown errors into McpPluginError
 *
 * @param err - Unknown error object
 * @param context - Additional context for the error
 * @returns McpPluginError instance
 */
export const wrapError = (err: unknown, context?: string): McpPluginError => {
  // If already a McpPluginError, return as-is
  if (err instanceof McpPluginError) {
    return err;
  }

  // If standard Error, wrap with context
  if (err instanceof Error) {
    const message = context ? `${context}: ${err.message}` : err.message;
    return new McpPluginError(message);
  }

  // For unknown error types, convert to string
  const message = context ? `${context}: ${String(err)}` : `Unknown error: ${String(err)}`;
  return new McpPluginError(message);
};

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_API_KEY: 'MISSING_API_KEY',
  PLUGIN_CREATION_FAILED: 'PLUGIN_CREATION_FAILED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
