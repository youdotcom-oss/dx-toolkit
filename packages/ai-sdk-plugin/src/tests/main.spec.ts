import { afterEach, describe, expect, mock, test } from 'bun:test'

type MockMcpClient = {
  tools: ReturnType<typeof mock<() => Promise<unknown>>>
}

const createMCPClientMock = mock(async () => ({
  tools: mock(
    async (): Promise<unknown> => ({
      'you-contents': { name: 'you-contents' },
      'you-research': { name: 'you-research' },
      'you-search': { name: 'you-search' },
    }),
  ),
})) as ReturnType<typeof mock<() => Promise<MockMcpClient>>>

mock.module('@ai-sdk/mcp', () => ({
  createMCPClient: createMCPClientMock,
}))

const { youTools } = await import('../main.ts')

describe('youTools', () => {
  const originalApiKey = process.env.YDC_API_KEY
  const originalServerUrl = process.env.MCP_SERVER_URL

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

  test('creates an MCP client with hosted HTTP transport scoped to the requested tools and returns its tools', async () => {
    const tools: unknown = {
      'you-contents': { name: 'you-contents' },
      'you-research': { name: 'you-research' },
      'you-search': { name: 'you-search' },
    }
    const toolsMock = mock(async (): Promise<unknown> => tools)
    createMCPClientMock.mockResolvedValueOnce({ tools: toolsMock })

    const result = (await youTools({
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
    expect(toolsMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(tools)
  })

  test('uses the hosted MCP base URL even when MCP_SERVER_URL is set in the environment', async () => {
    process.env.YDC_API_KEY = 'env-key'
    process.env.MCP_SERVER_URL = 'https://env.example.com/mcp'

    await youTools({
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
    process.env.YDC_API_KEY = 'env-key'

    await youTools({
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
    delete process.env.YDC_API_KEY

    await youTools({
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
