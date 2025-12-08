/**
 * @youdotcom-oss/ai-sdk-plugin
 *
 * Vercel AI SDK plugin for You.com web search, AI agents, and content extraction.
 * Uses Model Context Protocol (MCP) to connect to You.com's MCP server.
 */

export { createYouMCPClient } from './client.ts';
export {
  API_KEY_ENV_VAR,
  DEFAULT_CLIENT_NAME,
  DEFAULT_SERVER_URL,
  EXPECTED_TOOLS,
  type ExpectedToolName,
} from './constants.ts';
export type {
  YouMCPClientConfig,
  YouMCPClientResult,
} from './types.ts';
export { YouMCPClientError } from './types.ts';
