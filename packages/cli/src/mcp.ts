import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import packageJson from '../package.json' with { type: 'json' }

export const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'

export type McpToolResult = Awaited<ReturnType<Client['callTool']>>

export type ToolUrlOptions = {
  toolName: string
  profile?: string
}

export const buildToolUrl = ({ toolName, profile }: ToolUrlOptions): URL => {
  const url = new URL(BASE_MCP_SERVER_URL)

  if (profile) {
    url.searchParams.set('profile', profile)
    return url
  }

  url.searchParams.set('tools', toolName)
  return url
}

export const getAuthHeaders = (apiKey?: string): Record<string, string> | undefined => {
  if (!apiKey) {
    return undefined
  }

  return { Authorization: `Bearer ${apiKey}` }
}

export const sanitizeHeaders = (headers?: Record<string, string>): Record<string, string> => {
  if (!headers) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value,
    ]),
  )
}

export const withClient = async <T>(
  url: URL,
  headers: Record<string, string> | undefined,
  fn: (client: Client) => Promise<T>,
): Promise<T> => {
  const transport = new StreamableHTTPClientTransport(url, headers ? { requestInit: { headers } } : undefined)
  const client = new Client({ name: 'ydc', version: packageJson.version })

  try {
    await client.connect(transport)
    return await fn(client)
  } finally {
    await Promise.allSettled([client.close(), transport.close()])
  }
}

export const normalizeToolResult = (result: McpToolResult): unknown => {
  if (result.structuredContent !== undefined) {
    return result.structuredContent
  }

  if ('toolResult' in result) {
    return (result as { toolResult: unknown }).toolResult
  }

  const firstText = result.content.find(
    (item): item is { text: string; type: 'text' } => item.type === 'text' && 'text' in item,
  )

  if (!firstText) {
    return result
  }

  try {
    return JSON.parse(firstText.text) as unknown
  } catch {
    return result
  }
}
