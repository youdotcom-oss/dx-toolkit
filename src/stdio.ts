#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerContentsTool } from './contents/register-contents-tool.ts';
import { registerExpressTool } from './express/register-express-tool.ts';
import { getMCpServer } from './get-mcp-server.ts';
import { registerSearchTool } from './search/register-search-tool.ts';
import { useGetClientVersion } from './shared/use-client-version.ts';

const YDC_API_KEY = process.env.YDC_API_KEY;

try {
  const mcp = getMCpServer();
  const getUserAgent = useGetClientVersion(mcp);

  registerSearchTool({ mcp, YDC_API_KEY, getUserAgent });
  registerExpressTool({ mcp, YDC_API_KEY, getUserAgent });
  registerContentsTool({ mcp, YDC_API_KEY, getUserAgent });

  const transport = new StdioServerTransport();
  await mcp.connect(transport);
} catch (error) {
  process.stderr.write(`Failed to start server: ${error}\n`);
  process.exit(1);
}
