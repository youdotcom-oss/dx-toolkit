import { randomUUID } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const tools = JSON.parse(process.env.YDC_TEST_MCP_TOOLS ?? '[]') as Array<{
  inputSchema: {
    properties?: Record<string, unknown>
    required?: string[]
    type: 'object'
  }
  name: string
  outputSchema?: {
    properties?: Record<string, unknown>
    required?: string[]
    type: 'object'
  }
}>
const transports = new Map<
  string,
  {
    server: Server
    transport: WebStandardStreamableHTTPServerTransport
  }
>()

const createTestServer = () => {
  const server = new Server(
    {
      name: 'test-cli-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }))
  server.setRequestHandler(CallToolRequestSchema, async () => ({
    content: [
      {
        text: JSON.stringify({ ok: true }),
        type: 'text',
      },
    ],
  }))

  return server
}

const mockedFetch: typeof fetch = Object.assign(
  async (input: string | URL | Request, init?: RequestInit | BunFetchRequestInit) => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(input instanceof URL ? input.toString() : input, init)
    const traceFile = process.env.YDC_TEST_MCP_TRACE_FILE
    const sessionId = request.headers.get('mcp-session-id')

    if (traceFile) {
      appendFileSync(
        traceFile,
        `${JSON.stringify({
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
          url: request.url,
        })}\n`,
      )
    }

    if (sessionId) {
      const activeTransport = transports.get(sessionId)?.transport

      if (activeTransport) {
        return activeTransport.handleRequest(request)
      }
    }

    const server = createTestServer()
    let transport!: WebStandardStreamableHTTPServerTransport

    transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      onsessionclosed: (closedSessionId) => {
        transports.delete(closedSessionId)
      },
      onsessioninitialized: (initializedSessionId) => {
        transports.set(initializedSessionId, { server, transport })
      },
      sessionIdGenerator: () => randomUUID(),
    })

    await server.connect(transport)

    return transport.handleRequest(request)
  },
  {
    preconnect: globalThis.fetch.preconnect.bind(globalThis.fetch),
  },
)

globalThis.fetch = mockedFetch
