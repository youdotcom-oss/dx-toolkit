import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import packageJson from '../package.json' with { type: 'json' }
import type { KnownToolInput, KnownToolName, KnownToolOutput } from './tool-schemas.ts'

export type {
  KnownToolInput,
  KnownToolName,
  KnownToolOutput,
  YouContentsInput,
  YouContentsOutput,
  YouResearchInput,
  YouResearchOutput,
  YouSearchInput,
  YouSearchOutput,
} from './tool-schemas.ts'
export { API_TOOL_SCHEMA_HASH, API_TOOL_SCHEMAS } from './tool-schemas.ts'

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'

type SchemaTarget = 'input' | 'output'

export type YouApiConfig = {
  apiKey?: string
  allowedTools?: string | string[]
  profile?: string
}

const buildMcpUrl = ({ allowedTools, profile }: Pick<YouApiConfig, 'allowedTools' | 'profile'>) => {
  const url = new URL(BASE_MCP_SERVER_URL)

  if (profile) {
    url.searchParams.set('profile', profile)
  }

  const tools = Array.isArray(allowedTools)
    ? allowedTools.length > 0
      ? allowedTools.join(',')
      : undefined
    : allowedTools || process.env.YDC_ALLOWED_TOOLS

  if (tools) {
    url.searchParams.set('tools', tools)
  }

  return url
}

export type YouApi = {
  call: {
    <Tool extends KnownToolName>(tool: Tool, input: KnownToolInput<Tool>): Promise<KnownToolOutput<Tool>>
    <Result = unknown>(tool: string, input?: Record<string, unknown>): Promise<Result>
  }
  close: () => Promise<void>
  schema: (tool: string, target?: SchemaTarget) => Promise<unknown>
  tools: () => ReturnType<Client['listTools']>
}

export const createYouApi = async ({
  allowedTools,
  apiKey = process.env.YDC_API_KEY,
  profile,
}: YouApiConfig = {}): Promise<YouApi> => {
  const transport = new StreamableHTTPClientTransport(buildMcpUrl({ allowedTools, profile }), {
    requestInit: {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    },
  })
  const client = new Client({
    name: packageJson.name,
    version: packageJson.version,
  })

  await client.connect(transport)

  return {
    call: async <Result = unknown>(tool: string, input: Record<string, unknown> = {}) => {
      const result = await client.callTool({
        arguments: input,
        name: tool,
      })

      if (result.isError) {
        throw new Error(`Tool ${tool} returned an error`)
      }

      if (result.structuredContent === undefined) {
        throw new Error(`Tool ${tool} did not return structured content`)
      }

      return result.structuredContent as Result
    },
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
