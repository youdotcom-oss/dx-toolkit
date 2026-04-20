import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SearchResponse } from '@youdotcom-oss/api'
import * as api from '@youdotcom-oss/api'
import { registerSearchTool } from '../register-search-tool.ts'

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
let fetchSearchResultsSpy: ReturnType<typeof spyOn<typeof api, 'fetchSearchResults'>> | undefined
let generateErrorReportLinkSpy: ReturnType<typeof spyOn<typeof api, 'generateErrorReportLink'>> | undefined

type Cleanup = () => Promise<void>

const setupMcpClient = async (): Promise<{ client: Client; cleanup: Cleanup }> => {
  const server = new McpServer({ name: 'test', version: '0.0.0' }, { capabilities: { logging: {}, tools: {} } })
  registerSearchTool({
    mcp: server,
    YDC_API_KEY: 'test-key',
    getUserAgent: () => 'test-agent',
  })

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
    fetchSearchResultsSpy = spyOn(api, 'fetchSearchResults').mockImplementation(async () => {
      if (mockFetchResponse instanceof Error) throw mockFetchResponse
      return mockFetchResponse
    })
    generateErrorReportLinkSpy = spyOn(api, 'generateErrorReportLink').mockImplementation(
      () => 'https://example.com/report',
    )
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
      cleanup = undefined
    }
    fetchSearchResultsSpy?.mockRestore()
    fetchSearchResultsSpy = undefined
    generateErrorReportLinkSpy?.mockRestore()
    generateErrorReportLinkSpy = undefined
  })

  test('handles empty search results gracefully', async () => {
    const result = await setupMcpClient()
    cleanup = result.cleanup

    const toolResult = await result.client.callTool({ name: 'you-search', arguments: { query: 'nonexistent' } })

    expect(toolResult.content).toEqual([{ type: 'text', text: 'No results found.' }])
    expect(toolResult.structuredContent).toEqual(emptyResponse)
  })

  test('returns formatted results for successful search', async () => {
    mockFetchResponse = oneResultResponse
    const result = await setupMcpClient()
    cleanup = result.cleanup

    const toolResult = await result.client.callTool({ name: 'you-search', arguments: { query: 'example' } })

    const text = (toolResult.content as Array<{ type: string; text: string }>)[0]?.text
    expect(text).toContain('Example')
    expect(text).toContain('https://example.com')

    expect(toolResult.structuredContent).toEqual(oneResultResponse)
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
