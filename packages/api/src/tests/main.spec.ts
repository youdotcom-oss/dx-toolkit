import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMcpHandler, fromJsonSchema, type JsonSchemaType, McpServer } from '@modelcontextprotocol/server'
import type { YouSearchInput, YouSearchOutput } from '../main.ts'
import { createYouApi } from '../main.ts'

type ToolSchema = {
  properties?: Record<string, unknown>
  required?: string[]
  type: 'object'
}

const testTools: Array<{ inputSchema: ToolSchema; name: string; outputSchema?: ToolSchema }> = [
  {
    inputSchema: {
      properties: {
        urls: {
          items: {
            type: 'string',
          },
          type: 'array',
        },
      },
      required: ['urls'],
      type: 'object',
    },
    name: 'you-contents',
    outputSchema: {
      type: 'object',
    },
  },
  {
    inputSchema: {
      properties: {
        input: {
          type: 'string',
        },
      },
      required: ['input'],
      type: 'object',
    },
    name: 'you-research',
    outputSchema: {
      type: 'object',
    },
  },
  {
    inputSchema: {
      properties: {
        query: {
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
    name: 'you-search',
    outputSchema: {
      properties: {
        ok: {
          type: 'boolean',
        },
      },
      type: 'object',
    },
  },
]

let originalFetch: typeof fetch
let tempDir: string
let traceFile: string
let receivedToolInputs: unknown[]

describe('createYouApi', () => {
  const originalApiKey = process.env.YDC_API_KEY
  const originalAllowedTools = process.env.YDC_ALLOWED_TOOLS

  beforeEach(() => {
    originalFetch = globalThis.fetch
    tempDir = mkdtempSync(join(tmpdir(), 'you-api-'))
    traceFile = join(tempDir, 'trace.jsonl')
    receivedToolInputs = []
    globalThis.fetch = createMockedFetch(traceFile)
  })

  afterEach(async () => {
    globalThis.fetch = originalFetch
    delete process.env.YDC_API_KEY
    delete process.env.YDC_ALLOWED_TOOLS

    if (originalApiKey) {
      process.env.YDC_API_KEY = originalApiKey
    }

    if (originalAllowedTools) {
      process.env.YDC_ALLOWED_TOOLS = originalAllowedTools
    }

    rmSync(tempDir, { force: true, recursive: true })
  })

  test('calls a hosted MCP tool through the configured allowed tool set', async () => {
    assertSearchTypes({ query: 'AI' }, { metadata: {}, results: {} })

    const you = await createYouApi({
      allowedTools: ['you-search', 'you-research'],
      apiKey: 'config-key',
    })

    const result = await you.call<{ input: { query: string }; ok: boolean }>('you-search' as string, { query: 'AI' })

    expect(result).toEqual({ input: { query: 'AI' }, ok: true })
    expect(receivedToolInputs).toEqual([{ query: 'AI' }])
    const trace = readTrace()
    expect(trace.length).toBeGreaterThan(0)
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?tools=you-search%2Cyou-research')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer config-key')).toBe(true)
    await you.close()
  })

  test('throws when a hosted MCP tool omits structured content', async () => {
    const you = await createYouApi({
      allowedTools: 'you-search',
      apiKey: 'config-key',
    })

    await expect(you.call('you-search', { query: 'missing-structured-content' })).rejects.toThrow(
      'Tool you-search did not return structured content',
    )
    await you.close()
  })

  test('throws when a hosted MCP tool returns an error result', async () => {
    const you = await createYouApi({
      allowedTools: 'you-search',
      apiKey: 'config-key',
    })

    await expect(you.call('you-search', { query: 'tool-error' })).rejects.toThrow('Tool you-search returned an error')
    await you.close()
  })

  test('uses YDC_ALLOWED_TOOLS when an environment API key is available', async () => {
    process.env.YDC_API_KEY = 'env-key'
    process.env.YDC_ALLOWED_TOOLS = 'you-search,you-finance'

    const you = await createYouApi()

    await you.call('you-search', { query: 'AI' })

    const trace = readTrace()
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?tools=you-search%2Cyou-finance')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer env-key')).toBe(true)
    await you.close()
  })

  test('returns the default authenticated hosted tools when no scope is provided', async () => {
    const you = await createYouApi({
      apiKey: 'config-key',
    })

    const tools = await you.tools()

    expect(tools.tools.map(({ name }) => name)).toEqual(['you-contents', 'you-research', 'you-search'])
    const trace = readTrace()
    expect(
      trace.every(
        ({ url }) =>
          url ===
          'https://api.you.com/mcp?tools=you-answer%2Cyou-contents%2Cyou-discover%2Cyou-finance%2Cyou-research%2Cyou-search',
      ),
    ).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer config-key')).toBe(true)
    await you.close()
  })

  test('treats an empty allowed tools array as no scope', async () => {
    const you = await createYouApi({
      allowedTools: [],
      apiKey: 'config-key',
    })

    await you.tools()

    const trace = readTrace()
    expect(
      trace.every(
        ({ url }) =>
          url ===
          'https://api.you.com/mcp?tools=you-answer%2Cyou-contents%2Cyou-discover%2Cyou-finance%2Cyou-research%2Cyou-search',
      ),
    ).toBe(true)
    await you.close()
  })

  test('sends the Authorization header even when profile is free', async () => {
    const you = await createYouApi({
      profile: 'free',
      apiKey: 'config-key',
    })

    await you.tools()

    const trace = readTrace()
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?profile=free')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer config-key')).toBe(true)
    await you.close()
  })

  test('consults YDC_ALLOWED_TOOLS even when no API key is configured', async () => {
    delete process.env.YDC_API_KEY
    process.env.YDC_ALLOWED_TOOLS = 'you-search,you-research'

    const you = await createYouApi()

    await you.tools()

    const trace = readTrace()
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?tools=you-search%2Cyou-research')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === undefined)).toBe(true)
    await you.close()
  })

  test('emits both profile and tools query params when both are provided', async () => {
    const you = await createYouApi({
      profile: 'thoughtspot',
      allowedTools: ['you-search'],
      apiKey: 'config-key',
    })

    await you.tools()

    const trace = readTrace()
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?profile=thoughtspot&tools=you-search')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer config-key')).toBe(true)
    await you.close()
  })

  test('returns advertised tool schemas by tool name', async () => {
    const you = await createYouApi({
      allowedTools: 'you-search',
      apiKey: 'config-key',
    })

    const schema = await you.schema('you-search')

    expect(schema).toEqual(testTools.find(({ name }) => name === 'you-search')?.inputSchema)
    await you.close()
  })
})

const createTestServer = () => {
  const mcp = new McpServer(
    {
      name: 'test-api-mcp-server',
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

  for (const tool of testTools) {
    mcp.registerTool(
      tool.name,
      {
        inputSchema: fromJsonSchema(tool.inputSchema as JsonSchemaType),
      },
      async (args) => {
        receivedToolInputs.push(args)
        const query = (args as { query?: string } | undefined)?.query

        if (query === 'missing-structured-content') {
          return {
            content: [],
          }
        }

        if (query === 'tool-error') {
          return {
            content: [],
            isError: true,
            structuredContent: {
              message: 'Tool failed',
            },
          }
        }

        return {
          content: [],
          structuredContent: {
            input: args,
            ok: true,
          },
        }
      },
    )
  }

  return mcp
}

const handler = createMcpHandler(createTestServer, { legacy: 'stateless' })

const createMockedFetch = (activeTraceFile: string): typeof fetch =>
  Object.assign(
    async (input: string | URL | Request, init?: RequestInit | BunFetchRequestInit) => {
      const request =
        input instanceof Request
          ? new Request(input, init)
          : new Request(input instanceof URL ? input.toString() : input, init)

      await Bun.write(
        activeTraceFile,
        `${readExistingTrace(activeTraceFile)}${JSON.stringify({
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
          url: request.url,
        })}\n`,
      )

      return handler.fetch(request)
    },
    {
      preconnect: globalThis.fetch.preconnect.bind(globalThis.fetch),
    },
  )

const readExistingTrace = (activeTraceFile: string) => {
  try {
    return readFileSync(activeTraceFile, 'utf8')
  } catch {
    return ''
  }
}

const readTrace = () =>
  readExistingTrace(traceFile)
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { headers: Record<string, string>; method: string; url: string })

const assertSearchTypes = (_input: YouSearchInput, _output: YouSearchOutput) => {}
