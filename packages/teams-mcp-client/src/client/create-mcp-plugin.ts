// Main factory function for creating MCP client plugin

import { McpClientPlugin } from '@microsoft/teams.mcpclient';
import { mergeConfig } from '../config/config.ts';
import { ErrorCodes, McpPluginError, wrapError } from '../errors/error-handler.ts';
import type { McpPluginConfig, McpPluginResult } from './types.ts';

/**
 * Creates a Microsoft Teams MCP client plugin configured for You.com's MCP server
 *
 * @param config - Optional configuration object
 * @returns Object containing the plugin instance and validated configuration
 * @throws {McpPluginError} If configuration is invalid or plugin creation fails
 *
 * @example
 * ```typescript
 * // With API key from environment
 * const { plugin, config } = createMcpPlugin();
 *
 * // With explicit configuration
 * const { plugin, config } = createMcpPlugin({
 *   apiKey: 'your-api-key',
 *   timeout: 60000,
 *   debug: true,
 * });
 * ```
 */
export const createMcpPlugin = (config?: Partial<McpPluginConfig>): McpPluginResult => {
  try {
    // Merge and validate configuration
    const validatedConfig = mergeConfig(config);

    // Build MCP client plugin configuration
    const mcpClientConfig = {
      url: validatedConfig.mcpUrl,
      params: {
        headers: {
          Authorization: `Bearer ${validatedConfig.apiKey}`,
          ...validatedConfig.headers,
        },
        timeout: validatedConfig.timeout,
      },
    };

    // Create McpClientPlugin instance
    let plugin: McpClientPlugin;
    try {
      plugin = new McpClientPlugin();
    } catch (err: unknown) {
      throw wrapError(err, 'Failed to create MCP client plugin instance');
    }

    // Log debug information if enabled
    if (validatedConfig.debug) {
      // biome-ignore lint/suspicious/noConsole: Debug logging is intentional
      console.log('[teams-mcp-client] Plugin created successfully');
      // biome-ignore lint/suspicious/noConsole: Debug logging is intentional
      console.log('[teams-mcp-client] MCP Server URL:', validatedConfig.mcpUrl);
      // biome-ignore lint/suspicious/noConsole: Debug logging is intentional
      console.log('[teams-mcp-client] Timeout:', validatedConfig.timeout);
    }

    return {
      plugin,
      config: {
        ...validatedConfig,
        // Return config structure expected by Teams AI usePlugin()
        ...mcpClientConfig,
      },
    };
  } catch (err: unknown) {
    // Wrap any errors as McpPluginError
    if (err instanceof McpPluginError) {
      throw err;
    }

    throw new McpPluginError(wrapError(err, 'Failed to create MCP plugin').message, ErrorCodes.PLUGIN_CREATION_FAILED);
  }
};
