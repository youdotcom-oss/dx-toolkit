import { afterEach, describe, expect, mock, test } from 'bun:test'

const getToolsMock = mock(
  async (): Promise<unknown> => [{ name: 'you-search' }, { name: 'you-research' }, { name: 'you-contents' }],
)
const closeMock = mock(async (): Promise<void> => {})
const constructorCalls: unknown[] = []

class MultiServerMCPClientMock {
  close = closeMock
  getTools = getToolsMock

  constructor(config: unknown) {
    constructorCalls.push(config)
  }
}

const assertNonEmptySearchResult = (value: unknown) => {
  expect(value).toBeDefined()

  if (typeof value === 'string') {
    expect(value.length).toBeGreaterThan(0)

    try {
      const parsed = JSON.parse(value) as unknown
      assertNonEmptySearchResult(parsed)
    } catch {
      expect(value.trim().length).toBeGreaterThan(0)
    }

    return
  }

  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'object' && value !== null) {
    expect(Object.keys(value).length).toBeGreaterThan(0)
    return
  }

  throw new Error(`Unexpected search result type: ${typeof value}`)
}

describe('createYouClient', () => {
  const originalApiKey = process.env.YDC_API_KEY
  const originalServerUrl = process.env.MCP_SERVER_URL

  const loadMockedCreateYouClient = async () => {
    mock.module('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: MultiServerMCPClientMock,
    }))

    return (await import(`../main.ts?mocked=${Date.now()}-${Math.random()}`)).createYouClient
  }

  const loadRealCreateYouClient = async () =>
    (await import(`../main.ts?e2e=${Date.now()}-${Math.random()}`)).createYouClient

  afterEach(() => {
    closeMock.mockClear()
    getToolsMock.mockClear()
    constructorCalls.length = 0
    delete process.env.YDC_API_KEY
    delete process.env.MCP_SERVER_URL

    if (originalApiKey) {
      process.env.YDC_API_KEY = originalApiKey
    }

    if (originalServerUrl) {
      process.env.MCP_SERVER_URL = originalServerUrl
    }
  })

  test('executes you-search against the hosted MCP server', async () => {
    const createYouClient = await loadRealCreateYouClient()
    const client = await createYouClient({
      profile: 'free',
    })
    const tools = (await client.getTools()) as Array<{ invoke: (input: unknown) => Promise<unknown>; name: string }>
    const searchTool = tools.find((tool: { name: string }) => tool.name === 'you-search')

    expect(searchTool).toBeDefined()

    const result = await searchTool?.invoke({
      query: 'OpenAI',
    })

    assertNonEmptySearchResult(result)
    await client.close()
  })

  test('creates and returns a hosted MCP client scoped to the requested tools', async () => {
    const createYouClient = await loadMockedCreateYouClient()

    const result = (await createYouClient({
      apiKey: 'config-key',
      tools: ['you-search', 'you-contents'],
    })) as unknown

    expect(constructorCalls).toEqual([
      {
        mcpServers: {
          you: {
            headers: {
              Authorization: 'Bearer config-key',
            },
            transport: 'http',
            url: 'https://api.you.com/mcp?tools=you-search%2Cyou-contents',
          },
        },
      },
    ])
    expect(result).toBeInstanceOf(MultiServerMCPClientMock)
  })

  test('uses the hosted MCP base URL even when MCP_SERVER_URL is set in the environment', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    process.env.YDC_API_KEY = 'env-key'
    process.env.MCP_SERVER_URL = 'https://env.example.com/mcp'

    await createYouClient({
      tools: 'you-search',
    })

    expect(constructorCalls).toEqual([
      {
        mcpServers: {
          you: {
            headers: {
              Authorization: 'Bearer env-key',
            },
            transport: 'http',
            url: 'https://api.you.com/mcp?tools=you-search',
          },
        },
      },
    ])
  })

  test('uses the profile query parameter instead of tools when a profile is provided', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    process.env.YDC_API_KEY = 'env-key'

    await createYouClient({
      profile: 'free',
      tools: ['you-search', 'you-contents'],
    })

    expect(constructorCalls).toEqual([
      {
        mcpServers: {
          you: {
            headers: {
              Authorization: 'Bearer env-key',
            },
            transport: 'http',
            url: 'https://api.you.com/mcp?profile=free',
          },
        },
      },
    ])
  })

  test('omits Authorization when no API key is available', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    delete process.env.YDC_API_KEY

    await createYouClient({
      tools: 'you-search',
    })

    expect(constructorCalls).toEqual([
      {
        mcpServers: {
          you: {
            headers: undefined,
            transport: 'http',
            url: 'https://api.you.com/mcp?tools=you-search',
          },
        },
      },
    ])
  })
})
