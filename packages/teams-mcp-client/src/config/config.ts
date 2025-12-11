// Configuration management for teams-mcp-client

import type { McpPluginConfig, ResolvedMcpPluginConfig } from '../client/types.ts';
import { McpPluginConfigSchema } from '../shared/validators.ts';
import { DEFAULT_DEBUG, DEFAULT_HEADERS, DEFAULT_MCP_URL, DEFAULT_TIMEOUT } from './defaults.ts';

/**
 * Merges user configuration with defaults and validates the result
 *
 * @param userConfig - User-provided configuration (optional)
 * @returns Validated and merged configuration with all required properties
 * @throws {Error} If configuration validation fails
 */
export const mergeConfig = (userConfig?: Partial<McpPluginConfig>): ResolvedMcpPluginConfig => {
  // Get API key from config or environment variable
  const apiKey = userConfig?.apiKey ?? process.env.YDC_API_KEY;

  // Merge with defaults
  const merged: McpPluginConfig = {
    apiKey,
    mcpUrl: userConfig?.mcpUrl ?? DEFAULT_MCP_URL,
    headers: {
      ...DEFAULT_HEADERS,
      ...userConfig?.headers,
    },
    timeout: userConfig?.timeout ?? DEFAULT_TIMEOUT,
    debug: userConfig?.debug ?? DEFAULT_DEBUG,
  };

  // Validate merged configuration
  try {
    McpPluginConfigSchema.parse(merged);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Invalid configuration: ${err.message}`);
    }
    throw new Error('Invalid configuration: Unknown validation error');
  }

  // Additional validation: API key is required
  if (!merged.apiKey) {
    throw new Error('API key is required. Provide it via config.apiKey or YDC_API_KEY environment variable.');
  }

  // At this point, all properties are guaranteed to be defined (merged with defaults and validated)
  // Safe to cast to ResolvedMcpPluginConfig
  return merged as ResolvedMcpPluginConfig;
};
