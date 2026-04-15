import { describe, expect, mock, test } from 'bun:test'
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

const setupMcpClient = async () => {
  const server = new McpServer({ name: 'test', version: '0.0.0' }, { capabilities: { logging: {}, tools: {} } })
  registerSearchTool({ mcp: server, YDC_API_KEY: 'test-key', getUserAgent: () => 'test-agent' })

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await client.connect(clientTransport)

  return { client, server }
}

describe('registerSearchTool', () => {
  test('handles empty search results gracefully', async () => {
    mockFetchResponse = emptyResponse
    const { client } = await setupMcpClient()

    const result = await client.callTool({ name: 'you-search', arguments: { query: 'nonexistent' } })

    expect(result.content).toEqual([{ type: 'text', text: 'No results found.' }])
    expect(result.structuredContent).toEqual({
      resultCounts: { web: 0, news: 0, total: 0 },
    })
  })

  test('returns formatted results for successful search', async () => {
    mockFetchResponse = oneResultResponse
    const { client } = await setupMcpClient()

    const result = await client.callTool({ name: 'you-search', arguments: { query: 'example' } })

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text
    expect(text).toContain('Example')
    expect(text).toContain('https://example.com')

    const structured = result.structuredContent as Record<string, unknown>
    expect(structured).toHaveProperty('resultCounts')
    expect((structured as { resultCounts: { total: number } }).resultCounts.total).toBe(1)
  })

  test('returns error when API call fails', async () => {
    mockFetchResponse = new Error('API rate limit exceeded')
    const { client } = await setupMcpClient()

    const result = await client.callTool({ name: 'you-search', arguments: { query: 'test' } })

    expect(result.isError).toBe(true)
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text
    expect(text).toContain('API rate limit exceeded')
  })
})
