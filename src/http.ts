import { StreamableHTTPTransport } from '@hono/mcp';
import { type Context, Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import packageJson from '../package.json' with { type: 'json' };
import { registerContentsTool } from './contents/register-contents-tool.ts';
import { registerExpressTool } from './express/register-express-tool.ts';
import { getMCpServer } from './get-mcp-server.ts';
import { registerSearchTool } from './search/register-search-tool.ts';
import { useGetClientVersion } from './shared/use-client-version.ts';

const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

const handleMcpRequest = async (c: Context) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    c.status(401);
    c.header('Content-Type', 'text/plain');
    return c.text('Unauthorized: Authorization header required');
  }

  const YDC_API_KEY = extractBearerToken(authHeader);

  if (!YDC_API_KEY) {
    c.status(401);
    c.header('Content-Type', 'text/plain');
    return c.text('Unauthorized: Bearer token required');
  }
  const mcp = getMCpServer();
  const getUserAgent = useGetClientVersion(mcp);

  registerSearchTool({
    mcp,
    YDC_API_KEY,
    getUserAgent,
  });
  registerExpressTool({ mcp, YDC_API_KEY, getUserAgent });
  registerContentsTool({ mcp, YDC_API_KEY, getUserAgent });

  const transport = new StreamableHTTPTransport();
  await mcp.connect(transport);
  const response = await transport.handleRequest(c);

  // Explicitly set Content-Encoding to 'identity' to prevent httpx auto-decompression issues
  // httpx by default sends Accept-Encoding and attempts decompression, but MCP SSE streams
  // are not compressed. Setting 'identity' tells clients the response is uncompressed.
  response?.headers.set('Content-Encoding', 'identity');

  return response;
};

const app = new Hono();
app.use(trimTrailingSlash());

app.get('/mcp-health', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    service: 'youdotcom-mcp-server',
  });
});

app.all('/mcp', handleMcpRequest);
app.all('/mcp/', handleMcpRequest);

export default app;
