import { afterEach, describe, expect, mock, test } from 'bun:test'

const getToolsMock = mock(
  async (): Promise<unknown> => [{ name: 'you-search' }, { name: 'you-research' }, { name: 'you-contents' }],
)
const constructorCalls: unknown[] = []

class MultiServerMCPClientMock {
  getTools = getToolsMock

  constructor(config: unknown) {
    constructorCalls.push(config)
  }
}

mock.module('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: MultiServerMCPClientMock,
}))

const { youTools } = await import('../main.ts')

describe('youTools', () => {
  const originalApiKey = process.env.YDC_API_KEY
  const originalServerUrl = process.env.MCP_SERVER_URL

  afterEach(() => {
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

  test('creates a hosted MCP client scoped to the requested tools and returns LangChain tools', async () => {
    const tools: unknown = [{ name: 'you-search' }, { name: 'you-research' }, { name: 'you-contents' }]
    getToolsMock.mockResolvedValueOnce(tools)

    const result = (await youTools({
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
    expect(getToolsMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(tools)
  })

  test('uses the hosted MCP base URL even when MCP_SERVER_URL is set in the environment', async () => {
    process.env.YDC_API_KEY = 'env-key'
    process.env.MCP_SERVER_URL = 'https://env.example.com/mcp'

    await youTools({
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
    process.env.YDC_API_KEY = 'env-key'

    await youTools({
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
    delete process.env.YDC_API_KEY

    await youTools({
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
