// TypeScript interfaces for teams-mcp-client

import type { McpClientPlugin } from '@microsoft/teams.mcpclient';

/**
 * Configuration options for creating an MCP client plugin
 */
export interface McpPluginConfig {
  /**
   * You.com API key
   * @default process.env.YDC_API_KEY
   */
  apiKey?: string;

  /**
   * MCP server URL
   * @default 'https://api.you.com/mcp'
   */
  mcpUrl?: string;

  /**
   * Additional HTTP headers to include in requests
   * @default {}
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Resolved configuration after merging with defaults
 * All properties are required after validation
 */
export interface ResolvedMcpPluginConfig {
  /**
   * You.com API key
   */
  apiKey: string;

  /**
   * MCP server URL
   */
  mcpUrl: string;

  /**
   * Additional HTTP headers to include in requests
   */
  headers: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout: number;

  /**
   * Enable debug logging
   */
  debug: boolean;
}

/**
 * Extended configuration with Teams AI compatibility fields
 */
export interface ExtendedMcpPluginConfig extends ResolvedMcpPluginConfig {
  /**
   * MCP server URL (same as mcpUrl, for Teams AI usePlugin)
   */
  url: string;

  /**
   * Request parameters for Teams AI
   */
  params: {
    /**
     * HTTP headers including Authorization
     */
    headers: Record<string, string>;

    /**
     * Request timeout in milliseconds
     */
    timeout: number;
  };
}

/**
 * Result returned by createMcpPlugin()
 */
export interface McpPluginResult {
  /**
   * Microsoft Teams MCP client plugin instance
   */
  plugin: McpClientPlugin;

  /**
   * Validated and merged configuration with Teams AI compatibility fields
   */
  config: ExtendedMcpPluginConfig;
}
