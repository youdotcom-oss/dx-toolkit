#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import packageJson from '../package.json' with { type: 'json' }
import { TOOL_CONTRACT } from './tools.ts'

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'
const args = process.argv.slice(2)
const command = args[0]

const sanitizeHeaders = (headers?: Record<string, string>) =>
  headers
    ? Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [
          key,
          key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value,
        ]),
      )
    : {}

const parseExecutionFlags = (rawFlags: string[]) => {
  try {
    const { values } = parseArgs({
      args: rawFlags,
      options: {
        'api-key': { type: 'string' },
        profile: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
      },
      strict: true,
      allowPositionals: true,
    })

    return {
      apiKey: values['api-key'],
      dryRun: Boolean(values['dry-run']),
      profile: values.profile,
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

const buildToolUrl = ({ profile, toolName }: { profile?: string; toolName: string }) => {
  const url = new URL(BASE_MCP_SERVER_URL)

  if (profile) {
    url.searchParams.set('profile', profile)
  }

  url.searchParams.set('tools', process.env.YDC_ALLOWED_TOOLS ?? toolName)

  return url
}

const buildHelp = () =>
  [
    'Usage: ydc tools',
    '       ydc schema <tool> [input|output]',
    "       ydc <tool> '<json>' [flags]",
    "       echo '<json>' | ydc <tool>",
    '',
    'Agent-first CLI bridge for the hosted You.com MCP server.',
    '',
    'Commands:',
    '  tools                          List the locally allowlisted tool ids',
    '  schema <tool> [input|output]   Fetch the raw remote schema for a tool',
    "  <tool> '<json>'                Execute a remote tool with JSON input",
    '',
    'Tools:',
    `  ${TOOL_CONTRACT.tools.map(({ name }) => name).join(', ')}`,
    '',
    'Flags:',
    '  --api-key <key>   Use this API key instead of YDC_API_KEY',
    '  --dry-run         Print resolved URL, tool id, sanitized headers, and JSON arguments',
    '  --profile <name> Route to ?profile=<name> for any hosted profile',
    '  -h, --help        Show this help message',
    '',
    'Environment:',
    '  YDC_API_KEY          Optional default API key',
    '  YDC_ALLOWED_TOOLS    Optional comma-separated hosted tool ids',
  ].join('\n')

const isHelpRequest = command === '--help' || command === '-h'

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
  const tool = toolName ? TOOL_CONTRACT.tools.find((tool) => tool.name === toolName) : undefined
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

  const apiKey = parsedFlags.apiKey ?? process.env.YDC_API_KEY
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  const transport = new StreamableHTTPClientTransport(
    buildToolUrl({
      profile: parsedFlags.profile,
      toolName,
    }),
    headers
      ? {
          requestInit: {
            headers,
          },
        }
      : undefined,
  )
  const client = new Client({
    name: packageJson.name,
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

const tool = command ? TOOL_CONTRACT.tools.find((tool) => tool.name === command) : undefined

if (command && tool) {
  const rawInput = args[1] ?? (await new Response(Bun.stdin.stream()).text()).trim()
  const parsedFlags = parseExecutionFlags(args.slice(2))

  if (!rawInput) {
    console.error(`Missing JSON input for tool: ${command}`)
    process.exit(1)
  }

  let input: Record<string, unknown>

  try {
    input = JSON.parse(rawInput) as Record<string, unknown>
  } catch {
    console.error(`Invalid JSON input for tool: ${command}`)
    process.exit(1)
  }

  const apiKey = parsedFlags.apiKey ?? process.env.YDC_API_KEY
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  const url = buildToolUrl({
    profile: parsedFlags.profile,
    toolName: command,
  })

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
    name: packageJson.name,
    version: packageJson.version,
  })

  try {
    await client.connect(transport)
    const result = await client.callTool({
      arguments: input,
      name: command,
    })

    if (result.isError) {
      console.error(`Tool ${command} returned an error`)
      process.exit(1)
    }

    if (result.structuredContent === undefined) {
      console.error(`Tool ${command} did not return structured content`)
      process.exit(1)
    }

    console.log(JSON.stringify(result.structuredContent))
    process.exit(0)
  } finally {
    await Promise.allSettled([client.close(), transport.close()])
  }
}

if (!command) {
  console.error(buildHelp())
  process.exit(1)
}

if (isHelpRequest) {
  console.log(buildHelp())
  process.exit(0)
}

console.error(`Unknown command: ${command}`)
process.exit(1)
