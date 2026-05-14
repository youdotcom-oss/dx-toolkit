import { afterEach, describe, expect, mock, test } from 'bun:test'

type MockMcpClient = {
  close: ReturnType<typeof mock<() => Promise<void>>>
  tools: ReturnType<typeof mock<() => Promise<unknown>>>
}

const createMCPClientMock = mock(async () => ({
  close: mock(async (): Promise<void> => {}),
  tools: mock(
    async (): Promise<unknown> => ({
      'you-contents': { name: 'you-contents' },
      'you-research': { name: 'you-research' },
      'you-search': { name: 'you-search' },
    }),
  ),
})) as ReturnType<typeof mock<() => Promise<MockMcpClient>>>

const assertNonEmptySearchResult = (value: unknown) => {
  expect(value).toBeDefined()

  if (typeof value === 'string') {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'object' && value !== null) {
    if ('isError' in value) {
      expect(value.isError).not.toBe(true)
    }

    if ('content' in value && Array.isArray(value.content)) {
      expect(value.content.length).toBeGreaterThan(0)
      return
    }

    expect(Object.keys(value).length).toBeGreaterThan(0)
    return
  }

  throw new Error(`Unexpected search result type: ${typeof value}`)
}

describe('createYouClient', () => {
  const originalApiKey = process.env.YDC_API_KEY
  const originalServerUrl = process.env.MCP_SERVER_URL

  const loadMockedCreateYouClient = async () => {
    mock.module('@ai-sdk/mcp', () => ({
      createMCPClient: createMCPClientMock,
    }))

    return (await import(`../main.ts?mocked=${Date.now()}-${Math.random()}`)).createYouClient
  }

  const loadRealCreateYouClient = async () =>
    (await import(`../main.ts?e2e=${Date.now()}-${Math.random()}`)).createYouClient

  afterEach(() => {
    createMCPClientMock.mockClear()
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
    const tools = (await client.tools()) as Record<string, { execute: (...args: unknown[]) => Promise<unknown> }>
    const searchTool = tools['you-search']

    expect(searchTool).toBeDefined()

    if (!searchTool) {
      throw new Error('Missing you-search tool')
    }

    const result = await searchTool.execute(
      {
        query: 'OpenAI',
      },
      {
        messages: [],
        toolCallId: 'e2e-you-search',
      },
    )

    assertNonEmptySearchResult(result)
    await client.close()
  })

  test('creates and returns an MCP client with hosted HTTP transport scoped to the requested tools', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    const client = {
      close: mock(async (): Promise<void> => {}),
      tools: mock(
        async (): Promise<unknown> => ({
          'you-contents': { name: 'you-contents' },
          'you-research': { name: 'you-research' },
          'you-search': { name: 'you-search' },
        }),
      ),
    }
    createMCPClientMock.mockResolvedValueOnce(client)

    const result = (await createYouClient({
      apiKey: 'config-key',
      tools: ['you-search', 'you-contents'],
    })) as unknown

    expect(createMCPClientMock).toHaveBeenCalledWith({
      transport: {
        headers: {
          Authorization: 'Bearer config-key',
        },
        type: 'http',
        url: 'https://api.you.com/mcp?tools=you-search%2Cyou-contents',
      },
    })
    expect(result).toBe(client)
  })

  test('uses the hosted MCP base URL even when MCP_SERVER_URL is set in the environment', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    process.env.YDC_API_KEY = 'env-key'
    process.env.MCP_SERVER_URL = 'https://env.example.com/mcp'

    await createYouClient({
      tools: 'you-search',
    })

    expect(createMCPClientMock).toHaveBeenCalledWith({
      transport: {
        headers: {
          Authorization: 'Bearer env-key',
        },
        type: 'http',
        url: 'https://api.you.com/mcp?tools=you-search',
      },
    })
  })

  test('uses the profile query parameter instead of tools when a profile is provided', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    process.env.YDC_API_KEY = 'env-key'

    await createYouClient({
      profile: 'free',
      tools: ['you-search', 'you-contents'],
    })

    expect(createMCPClientMock).toHaveBeenCalledWith({
      transport: {
        headers: {
          Authorization: 'Bearer env-key',
        },
        type: 'http',
        url: 'https://api.you.com/mcp?profile=free',
      },
    })
  })

  test('omits Authorization when no API key is available', async () => {
    const createYouClient = await loadMockedCreateYouClient()
    delete process.env.YDC_API_KEY

    await createYouClient({
      tools: 'you-search',
    })

    expect(createMCPClientMock).toHaveBeenCalledWith({
      transport: {
        headers: undefined,
        type: 'http',
        url: 'https://api.you.com/mcp?tools=you-search',
      },
    })
  })
})
