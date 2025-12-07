import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import packageJson from '../../package.json' with { type: 'json' };

/**
 * Creates User-Agent string for API requests
 * Used by search and express agent API calls
 */
const setUserAgent = (client: string) => `MCP/${packageJson.version} (You.com; ${client})`;

/**
 * Get's function that returns a formatted client version information into a string
 * Used by stdio.ts and http.ts for logging/debugging
 */
export const useGetClientVersion = (mcp: McpServer) => () => {
  const clientVersion = mcp.server.getClientVersion();
  if (clientVersion) {
    const { name, version, title, websiteUrl } = clientVersion;
    return setUserAgent([name, version, title, websiteUrl].filter(Boolean).join('; '));
  }
  return setUserAgent('UNKNOWN');
};
