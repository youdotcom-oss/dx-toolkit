import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import packageJson from '../package.json' with { type: 'json' }

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'

type McpToolResult = Awaited<ReturnType<Client['callTool']>>
type SchemaTarget = 'input' | 'output'

export type YouApiConfig = {
  apiKey?: string
  allowedTools?: string | string[]
  profile?: string
}

export type YouApi = {
  call: <Result = unknown>(tool: string, input?: Record<string, unknown>) => Promise<Result>
  close: () => Promise<void>
  schema: (tool: string, target?: SchemaTarget) => Promise<unknown>
  tools: () => ReturnType<Client['listTools']>
}

export const createYouApi = async ({
  allowedTools,
  apiKey = process.env.YDC_API_KEY,
  profile,
}: YouApiConfig = {}): Promise<YouApi> => {
  const transport = new StreamableHTTPClientTransport(buildMcpUrl({ allowedTools, apiKey, profile }), {
    requestInit: {
      headers: getAuthorizationHeaders(apiKey, profile),
    },
  })
  const client = new Client({
    name: packageJson.name,
    version: packageJson.version,
  })

  await client.connect(transport)

  return {
    call: async <Result = unknown>(tool: string, input: Record<string, unknown> = {}) =>
      normalizeToolResult<Result>(
        await client.callTool({
          arguments: input,
          name: tool,
        }),
      ),
    close: async () => {
      await Promise.allSettled([client.close(), transport.close()])
    },
    schema: async (tool: string, target: SchemaTarget = 'input') => {
      const listedTools = await client.listTools()
      const matchedTool = listedTools.tools.find(({ name: toolName }) => toolName === tool)

      if (!matchedTool) {
        throw new Error(`Tool ${tool} was not advertised by the hosted You.com MCP server`)
      }

      const schema = target === 'input' ? matchedTool.inputSchema : matchedTool.outputSchema

      if (!schema) {
        throw new Error(`Tool ${tool} has no advertised ${target} schema`)
      }

      return schema
    },
    tools: () => client.listTools(),
  }
}

const buildMcpUrl = ({ allowedTools, apiKey, profile }: Pick<YouApiConfig, 'allowedTools' | 'apiKey' | 'profile'>) => {
  const url = new URL(BASE_MCP_SERVER_URL)

  if (profile) {
    url.searchParams.set('profile', profile)
    return url
  }

  const tools = allowedTools ?? (apiKey ? process.env.YDC_ALLOWED_TOOLS : undefined)

  if (tools) {
    url.searchParams.set('tools', Array.isArray(tools) ? tools.join(',') : tools)
  }

  return url
}

const getAuthorizationHeaders = (apiKey?: string, profile?: string) => {
  if (!apiKey || profile === 'free') {
    return undefined
  }

  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

function normalizeToolResult<Result>(result: McpToolResult): Result {
  if (result.structuredContent !== undefined) {
    return result.structuredContent as Result
  }

  return result as Result
}
