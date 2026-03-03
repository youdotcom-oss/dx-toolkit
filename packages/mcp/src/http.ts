import { StreamableHTTPTransport } from '@hono/mcp'
import { type Context, Hono } from 'hono'
import { trimTrailingSlash } from 'hono/trailing-slash'
import packageJson from '../package.json' with { type: 'json' }
import { registerContentsTool } from './contents/register-contents-tool.ts'
import { getMCpServer } from './get-mcp-server.ts'
import { registerResearchTool } from './research/register-research-tool.ts'
import { registerSearchTool } from './search/register-search-tool.ts'
import { useGetClientVersion } from './shared/use-client-version.ts'

const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

const handleMcpRequest = async (c: Context) => {
  const authHeader = c.req.header('Authorization')

  let YDC_API_KEY: string | undefined

  if (authHeader) {
    const token = extractBearerToken(authHeader)

    if (!token) {
      c.status(401)
      c.header('Content-Type', 'text/plain')
      return c.text('Unauthorized: Invalid Bearer token format')
    }

    YDC_API_KEY = token
  }

  const mcp = getMCpServer()
  const getUserAgent = useGetClientVersion(mcp)

  registerSearchTool({
    mcp,
    YDC_API_KEY,
    getUserAgent,
  })
  registerContentsTool({ mcp, YDC_API_KEY, getUserAgent })
  registerResearchTool({ mcp, YDC_API_KEY, getUserAgent })

  const transport = new StreamableHTTPTransport()
  await mcp.connect(transport)
  const response = await transport.handleRequest(c)

  // Explicitly set Content-Encoding to 'identity' to prevent httpx auto-decompression issues
  // httpx by default sends Accept-Encoding and attempts decompression, but MCP SSE streams
  // are not compressed. Setting 'identity' tells clients the response is uncompressed.
  response?.headers.set('Content-Encoding', 'identity')

  return response
}

const return405MethodNotAllowed = (c: Context) => {
  c.status(405)
  c.header('Allow', 'POST')
  c.header('Content-Type', 'application/json')
  return c.json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method Not Allowed: Use POST to send MCP requests',
    },
    id: null,
  })
}

const app = new Hono()
app.use(trimTrailingSlash())

app.get('/mcp-health', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    service: 'youdotcom-mcp-server',
  })
})

// POST handler for MCP requests (per MCP Streamable HTTP spec)
app.post('/mcp', handleMcpRequest)
app.post('/mcp/', handleMcpRequest)

// Fallback for other methods - returns 405 per MCP spec
// Spec: "The server MUST either return Content-Type: text/event-stream
// or else return HTTP 405 Method Not Allowed"
app.all('/mcp', return405MethodNotAllowed)
app.all('/mcp/', return405MethodNotAllowed)

export default app
