import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SearchResponse } from '@youdotcom-oss/api'
import { SearchQuerySchema } from '@youdotcom-oss/api'

const emptyResponse: SearchResponse = {
  results: { web: [], news: [] },
  metadata: { search_uuid: 'test', query: 'test', latency: 0 },
}

const oneResultResponse: SearchResponse = {
  results: {
    web: [
      {
        url: 'https://example.com',
        title: 'Example',
        description: 'A test result',
        snippets: ['snippet'],
        page_age: '2025-01-01T00:00:00',
        authors: [],
      },
    ],
    news: [],
  },
  metadata: { search_uuid: 'test', query: 'test', latency: 0.1 },
}

let mockFetchResponse: SearchResponse | Error = emptyResponse

mock.module('@youdotcom-oss/api', () => ({
  fetchSearchResults: async () => {
    if (mockFetchResponse instanceof Error) throw mockFetchResponse
    return mockFetchResponse
  },
  generateErrorReportLink: () => 'https://example.com/report',
  SearchQuerySchema,
}))

// Import after mock so the mock is active
const { registerSearchTool } = await import('../register-search-tool.ts')

type Cleanup = () => Promise<void>

const setupMcpClient = async (): Promise<{ client: Client; cleanup: Cleanup }> => {
  const server = new McpServer({ name: 'test', version: '0.0.0' }, { capabilities: { logging: {}, tools: {} } })
  registerSearchTool({ mcp: server, YDC_API_KEY: 'test-key', getUserAgent: () => 'test-agent' })

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await client.connect(clientTransport)

  const cleanup = async () => {
    await client.close()
    await server.close()
  }

  return { client, cleanup }
}

describe('registerSearchTool', () => {
  let cleanup: Cleanup | undefined

  beforeEach(() => {
    mockFetchResponse = emptyResponse
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
      cleanup = undefined
    }
  })

  test('handles empty search results gracefully', async () => {
    const result = await setupMcpClient()
    cleanup = result.cleanup

    const toolResult = await result.client.callTool({ name: 'you-search', arguments: { query: 'nonexistent' } })

    expect(toolResult.content).toEqual([{ type: 'text', text: 'No results found.' }])
    expect(toolResult.structuredContent).toEqual({
      resultCounts: { web: 0, news: 0, total: 0 },
    })
  })

  test('returns formatted results for successful search', async () => {
    mockFetchResponse = oneResultResponse
    const result = await setupMcpClient()
    cleanup = result.cleanup

    const toolResult = await result.client.callTool({ name: 'you-search', arguments: { query: 'example' } })

    const text = (toolResult.content as Array<{ type: string; text: string }>)[0]?.text
    expect(text).toContain('Example')
    expect(text).toContain('https://example.com')

    const structured = toolResult.structuredContent as Record<string, unknown>
    expect(structured).toHaveProperty('resultCounts')
    expect((structured as { resultCounts: { total: number } }).resultCounts.total).toBe(1)
  })

  test('returns error when API call fails', async () => {
    mockFetchResponse = new Error('API rate limit exceeded')
    const result = await setupMcpClient()
    cleanup = result.cleanup

    const toolResult = await result.client.callTool({ name: 'you-search', arguments: { query: 'test' } })

    expect(toolResult.isError).toBe(true)
    const text = (toolResult.content as Array<{ type: string; text: string }>)[0]?.text
    expect(text).toContain('API rate limit exceeded')
  })
})
