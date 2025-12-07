import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LoggingMessageNotification } from '@modelcontextprotocol/sdk/types.js';

/**
 * Creates a logger function that sends messages through MCP server
 * Used by tool registration files
 */
export const getLogger = (mcp: McpServer) => async (params: LoggingMessageNotification['params']) => {
  await mcp.server.sendLoggingMessage(params);
};
