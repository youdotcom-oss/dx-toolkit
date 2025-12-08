// Public API exports for @youdotcom-oss/teams-mcp-client
// Used when consuming this package as a library

// Main factory function
export { createMcpPlugin } from './client/create-mcp-plugin.ts';

// TypeScript types and interfaces
export type {
  ExtendedMcpPluginConfig,
  McpPluginConfig,
  McpPluginResult,
} from './client/types.ts';
// Configuration defaults (for advanced users)
export {
  DEFAULT_DEBUG,
  DEFAULT_HEADERS,
  DEFAULT_MCP_URL,
  DEFAULT_TIMEOUT,
} from './config/defaults.ts';
// Error handling
export {
  type ErrorCode,
  ErrorCodes,
  McpPluginError,
  wrapError,
} from './errors/error-handler.ts';

// Validation schema (for advanced users)
export {
  McpPluginConfigSchema,
  type ValidatedMcpPluginConfig,
} from './shared/validators.ts';
