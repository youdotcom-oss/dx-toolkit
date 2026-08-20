import { appendFileSync } from 'node:fs'
import { createMcpHandler, fromJsonSchema, type JsonSchemaType, McpServer } from '@modelcontextprotocol/server'

type ToolSchema = {
  properties?: Record<string, unknown>
  required?: string[]
  type: 'object'
}

const tools = JSON.parse(process.env.YDC_TEST_MCP_TOOLS ?? '[]') as Array<{
  inputSchema: ToolSchema
  name: string
  outputSchema?: ToolSchema
}>

const createTestServer = () => {
  const mcp = new McpServer(
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

  for (const tool of tools) {
    mcp.registerTool(
      tool.name,
      {
        inputSchema: fromJsonSchema(tool.inputSchema as JsonSchemaType),
        outputSchema: tool.outputSchema ? fromJsonSchema(tool.outputSchema as JsonSchemaType) : undefined,
      },
      async (args) => {
        const query = (args as { query?: string } | undefined)?.query

        if (query === 'tool-error') {
          return {
            content: [{ text: 'Error: tool failed', type: 'text' as const }],
            isError: true,
          }
        }

        if (query === 'missing-structured-content') {
          return {
            content: [{ text: 'No results found.', type: 'text' as const }],
          }
        }

        return {
          content: [{ text: JSON.stringify({ ok: true }), type: 'text' as const }],
          structuredContent: { ok: true },
        }
      },
    )
  }

  return mcp
}

const handler = createMcpHandler(createTestServer, { legacy: 'stateless' })

const mockedFetch: typeof fetch = Object.assign(
  async (input: string | URL | Request, init?: RequestInit | BunFetchRequestInit) => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(input instanceof URL ? input.toString() : input, init)
    const traceFile = process.env.YDC_TEST_MCP_TRACE_FILE

    if (traceFile) {
      const body = parseJsonBody(await request.clone().text())

      appendFileSync(
        traceFile,
        `${JSON.stringify({
          body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
          url: request.url,
        })}\n`,
      )
    }

    return handler.fetch(request)
  },
  {
    preconnect: globalThis.fetch.preconnect.bind(globalThis.fetch),
  },
)

globalThis.fetch = mockedFetch

function parseJsonBody(value: string): unknown {
  if (!value) {
    return undefined
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
}
