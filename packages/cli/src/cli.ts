#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import packageJson from '../package.json' with { type: 'json' }
import { TOOL_CONTRACT } from './tools.ts'

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'
type McpToolResult = Awaited<ReturnType<Client['callTool']>>
const args = process.argv.slice(2)
const command = args[0]
const usage = `Usage: ydc tools
       ydc schema <tool> [input|output]
       ydc <tool> <json> [flags]`

if (command === 'tools') {
  console.log(
    JSON.stringify({
      contractHash: TOOL_CONTRACT.contractHash,
      surfaceVersion: TOOL_CONTRACT.surfaceVersion,
      tools: TOOL_CONTRACT.tools.map(({ name }) => name),
    }),
  )
  process.exit(0)
}

if (command === 'schema') {
  const toolName = args[1]
  const tool = toolName ? getTool(toolName) : undefined
  const hasExplicitTarget = args[2] === 'input' || args[2] === 'output'
  const schemaTarget = hasExplicitTarget ? args[2] : 'input'
  const parsedFlags = parseExecutionFlags(args.slice(hasExplicitTarget ? 3 : 2))

  if (!toolName || !tool) {
    console.error(`Unknown tool: ${toolName ?? '<missing>'}`)
    process.exit(1)
  }

  if (schemaTarget !== 'input' && schemaTarget !== 'output') {
    console.error(`Unknown schema target: ${schemaTarget}`)
    process.exit(1)
  }

  if (parsedFlags.profile && !tool.supportsFreeProfile) {
    console.error('--profile is only supported for you-search')
    process.exit(1)
  }

  const headers =
    parsedFlags.profile === 'free' ? undefined : getAuthorizationHeaders(parsedFlags.apiKey ?? process.env.YDC_API_KEY)
  const transport = new StreamableHTTPClientTransport(
    buildToolUrl(toolName, parsedFlags.profile),
    headers
      ? {
          requestInit: {
            headers,
          },
        }
      : undefined,
  )
  const client = new Client({
    name: 'ydc',
    version: packageJson.version,
  })

  try {
    await client.connect(transport)
    const result = await client.listTools()
    const tool = result.tools.find(({ name }) => name === toolName)

    if (!tool) {
      console.error(`Tool ${toolName} is in the local contract but was not advertised by the remote MCP server`)
      process.exit(1)
    }

    const schema = schemaTarget === 'input' ? tool.inputSchema : tool.outputSchema

    if (!schema) {
      console.error(`Tool ${toolName} has no advertised ${schemaTarget} schema`)
      process.exit(1)
    }

    console.log(JSON.stringify(schema))
    process.exit(0)
  } finally {
    await Promise.allSettled([client.close(), transport.close()])
  }
}

if (command && getTool(command)) {
  const tool = getTool(command)
  const rawInput = args[1] ?? (await new Response(Bun.stdin.stream()).text()).trim()
  const parsedFlags = parseExecutionFlags(args.slice(2))

  if (!tool) {
    console.error(`Unknown tool: ${command}`)
    process.exit(1)
  }

  if (!rawInput) {
    console.error(`Missing JSON input for tool: ${command}`)
    process.exit(1)
  }

  if (parsedFlags.profile && !tool.supportsFreeProfile) {
    console.error('--profile is only supported for you-search')
    process.exit(1)
  }

  let input: Record<string, unknown>

  try {
    input = JSON.parse(rawInput) as Record<string, unknown>
  } catch {
    console.error(`Invalid JSON input for tool: ${command}`)
    process.exit(1)
  }

  const headers =
    parsedFlags.profile === 'free' ? undefined : getAuthorizationHeaders(parsedFlags.apiKey ?? process.env.YDC_API_KEY)
  const url = buildToolUrl(command, parsedFlags.profile)

  if (parsedFlags.dryRun) {
    console.log(
      JSON.stringify({
        arguments: input,
        headers: sanitizeHeaders(headers),
        tool: command,
        url: url.toString(),
      }),
    )
    process.exit(0)
  }

  const transport = new StreamableHTTPClientTransport(
    url,
    headers
      ? {
          requestInit: {
            headers,
          },
        }
      : undefined,
  )
  const client = new Client({
    name: 'ydc',
    version: packageJson.version,
  })

  try {
    await client.connect(transport)
    const result = await client.callTool({
      arguments: input,
      name: command,
    })

    console.log(JSON.stringify(normalizeToolResult(result)))
    process.exit(0)
  } finally {
    await Promise.allSettled([client.close(), transport.close()])
  }
}

if (!command || command === '--help') {
  console.log(usage)
  process.exit(0)
}

console.error(`Unknown command: ${command}`)
process.exit(1)

function normalizeToolResult(result: McpToolResult) {
  if (result.structuredContent !== undefined) {
    return result.structuredContent
  }

  if ('toolResult' in result) {
    return result.toolResult
  }

  const firstText = result.content.find(
    (item): item is { text: string; type: 'text' } => item.type === 'text' && 'text' in item,
  )

  if (!firstText) {
    return result
  }

  try {
    return JSON.parse(firstText.text)
  } catch {
    return result
  }
}

function buildToolUrl(toolName: string, profile?: string) {
  const url = new URL(BASE_MCP_SERVER_URL)

  if (profile) {
    url.searchParams.set('profile', profile)
    return url
  }

  url.searchParams.set('tools', toolName)

  return url
}

function getAuthorizationHeaders(apiKey?: string) {
  if (!apiKey) {
    return undefined
  }

  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

function parseExecutionFlags(rawFlags: string[]) {
  let apiKey: string | undefined
  let dryRun = false
  let profile: string | undefined

  for (let index = 0; index < rawFlags.length; index += 1) {
    const flag = rawFlags[index]

    if (flag === '--dry-run') {
      dryRun = true
      continue
    }

    if (flag === '--api-key') {
      apiKey = rawFlags[index + 1]
      index += 1
      continue
    }

    if (flag === '--profile') {
      profile = rawFlags[index + 1]
      index += 1
    }
  }

  return { apiKey, dryRun, profile }
}

function sanitizeHeaders(headers?: Record<string, string>) {
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

function getTool(toolName: string) {
  return TOOL_CONTRACT.tools.find((tool) => tool.name === toolName)
}
