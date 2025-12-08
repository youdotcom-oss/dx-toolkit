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
 * Result returned by createMcpPlugin()
 */
export interface McpPluginResult {
  /**
   * Microsoft Teams MCP client plugin instance
   */
  plugin: McpClientPlugin;

  /**
   * Validated and merged configuration
   */
  config: McpPluginConfig;
}
