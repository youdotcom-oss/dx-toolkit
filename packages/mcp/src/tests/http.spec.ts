import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import httpApp from '../http.ts'
import type { SearchStructuredContent } from '../search/search.schema.ts'

// Increase default timeout for hooks to prevent intermittent failures
setDefaultTimeout(15_000)

let server: ReturnType<typeof Bun.serve>
let baseUrl: string
let mcpClient: Client
const testApiKey = process.env.YDC_API_KEY

beforeAll(async () => {
  // Start HTTP server on random port
  const port = Math.floor(Math.random() * 10000) + 20000
  baseUrl = `http://localhost:${port}`

  // Start actual HTTP server using Bun
  server = Bun.serve({
    port,
    fetch: httpApp.fetch.bind(httpApp),
  })

  // Wait a bit for server to start
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Create MCP client with HTTP transport for e2e testing
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${testApiKey}`,
      },
    },
  })

  mcpClient = new Client({
    name: 'test-http-client',
    version: '1.0.0',
  })

  await mcpClient.connect(transport)
})

afterAll(async () => {
  if (mcpClient) {
    await mcpClient.close()
  }

  if (server) {
    server.stop()
    // Wait a bit for server to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
})

describe('HTTP Server Endpoints', () => {
  test('health endpoint returns service status', async () => {
    const response = await fetch(`${baseUrl}/mcp-health`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')

    const data = (await response.json()) as {
      status: string
      timestamp: string
      version: string
      service: string
    }
    expect(data).toHaveProperty('status', 'healthy')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('service', 'youdotcom-mcp-server')
    expect(typeof data.timestamp).toBe('string')
    expect(typeof data.version).toBe('string')
  })

  test('mcp endpoint allows requests without authorization (free tier)', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    })

    // Should succeed without auth header (free tier)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
    expect(text).toContain('result')
  })

  test('mcp endpoint requires Bearer token format when auth header provided', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'InvalidFormat token123',
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('text/plain')

    const text = await response.text()
    expect(text).toBe('Unauthorized: Invalid Bearer token format')
  })

  test('mcp endpoint accepts valid Bearer token', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    // StreamableHTTPTransport uses SSE format, so response will be streaming
    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
    expect(text).toContain('result')
    expect(text).toContain('protocolVersion')
    expect(text).toContain('capabilities')
  })

  test('mcp endpoint with trailing slash works identically', async () => {
    const response = await fetch(`${baseUrl}/mcp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
    expect(text).toContain('result')
    expect(text).toContain('protocolVersion')
    expect(text).toContain('capabilities')
  })

  test('mcp endpoint with trailing slash allows requests without authorization', async () => {
    const response = await fetch(`${baseUrl}/mcp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    })

    // Should succeed without auth header (free tier)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
  })
})

describe('HTTP Method Handling', () => {
  test('mcp endpoint returns 405 for GET requests per MCP spec', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
    })

    // Verify 405 status
    expect(response.status).toBe(405)

    // Verify Allow header (RFC 9110 §15.5.6)
    expect(response.headers.get('allow')).toBe('POST')

    // Verify JSON-RPC error format
    expect(response.headers.get('content-type')).toContain('application/json')

    const data = (await response.json()) as {
      jsonrpc: string
      error: { code: number; message: string }
      id: null
    }
    expect(data).toHaveProperty('jsonrpc', '2.0')
    expect(data).toHaveProperty('error')
    expect(data.error).toHaveProperty('code', -32000)
    expect(data.error.message).toContain('Method Not Allowed')
  })

  test('mcp endpoint returns 405 for DELETE requests', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${testApiKey}`,
      },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })

  test('mcp endpoint returns 405 for PUT requests', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })

  test('mcp endpoint with trailing slash returns 405 for GET', async () => {
    const response = await fetch(`${baseUrl}/mcp/`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })
})

describe('HTTP MCP Endpoint Basic Functionality', () => {
  test('mcp endpoint responds to valid Bearer token', async () => {
    // Test that the endpoint accepts valid Bearer token and doesn't return auth error
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'ping',
        id: 1,
      }),
    })

    // Should get a response (not 401/403), even if the method isn't supported
    expect(response.status).not.toBe(401)
    expect(response.status).not.toBe(403)

    // Should be SSE response for StreamableHTTPTransport
    expect(response.headers.get('content-type')).toContain('text/event-stream')
  })

  test('mcp endpoint processes JSON-RPC requests', async () => {
    // Test basic JSON-RPC structure handling
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'unknown-method',
        id: 123,
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    // StreamableHTTPTransport uses SSE format
    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
    expect(text).toContain('123')
  })

  test('mcp endpoint extracts Bearer token correctly', async () => {
    // Test that different tokens are processed
    const response1 = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer token123`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        id: 1,
      }),
    })

    const response2 = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer different-token`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        id: 2,
      }),
    })

    // Both should be processed (not authentication errors)
    expect(response1.status).not.toBe(401)
    expect(response2.status).not.toBe(401)
  })

  test('mcp endpoint uses StreamableHTTPTransport', async () => {
    // Test that the transport is properly handling requests
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        id: 42,
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    // StreamableHTTPTransport uses SSE format
    const text = await response.text()
    expect(text).toContain('data:')
    expect(text).toContain('jsonrpc')
    expect(text).toContain('42')
  })

  test(
    'mcp server handles search tool request for latest tech news',
    async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          id: 100,
          params: {
            name: 'you-search',
            arguments: {
              query: 'latest tech news',
              count: 3,
            },
          },
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/event-stream')

      const text = await response.text()
      expect(text).toContain('data:')
      expect(text).toContain('jsonrpc')
      expect(text).toContain('result')
      expect(text).toContain('latest tech news')
      expect(text).toContain('Search Results for')
    },
    { retry: 2 },
  )
})

describe('HTTP MCP Client E2E Tests', () => {
  test('mcp client can initialize and list tools', async () => {
    const tools = await mcpClient.listTools()

    expect(tools.tools).toBeDefined()
    expect(Array.isArray(tools.tools)).toBe(true)
    expect(tools.tools.length).toBeGreaterThan(0)

    // Verify search tool is available
    const searchTool = tools.tools.find((t) => t.name === 'you-search')
    expect(searchTool).toBeDefined()
    expect(searchTool?.title).toBe('Web Search')

    // Verify contents tool is available
    const contentsTool = tools.tools.find((t) => t.name === 'you-contents')
    expect(contentsTool).toBeDefined()
    expect(contentsTool?.title).toBe('Extract Web Page Contents')
  })

  test(
    'mcp client can call search tool successfully',
    async () => {
      const result = await mcpClient.callTool({
        name: 'you-search',
        arguments: {
          query: 'typescript tutorial',
          count: 2,
        },
      })

      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('structuredContent')

      const content = result.content as { type: string; text: string }[]
      expect(Array.isArray(content)).toBe(true)
      expect(content[0]).toHaveProperty('type', 'text')
      expect(content[0]).toHaveProperty('text')

      const text = content[0]?.text
      expect(text).toContain('Search Results for')
      expect(text).toContain('typescript tutorial')

      const structuredContent = result.structuredContent as SearchStructuredContent
      expect(structuredContent).toHaveProperty('resultCounts')
      expect(structuredContent.resultCounts).toHaveProperty('web')
      expect(structuredContent.resultCounts).toHaveProperty('total')
    },
    { retry: 2 },
  )

  test(
    'mcp client handles search with multiple results',
    async () => {
      const result = await mcpClient.callTool({
        name: 'you-search',
        arguments: {
          query: 'javascript frameworks',
          count: 3,
        },
      })

      const content = result.content as { type: string; text: string }[]
      const text = content[0]?.text

      expect(text).toContain('WEB RESULTS:')
      expect(text).toContain('Title:')
      expect(text).toContain('URL:')

      const structuredContent = result.structuredContent as SearchStructuredContent
      expect(structuredContent.resultCounts.web).toBeGreaterThan(0)
      expect(structuredContent.results?.web).toBeDefined()
      expect(structuredContent.results?.web?.length).toBeGreaterThanOrEqual(1)
    },
    { retry: 2 },
  )

  test(
    'mcp client handles search parameters correctly',
    async () => {
      const result = await mcpClient.callTool({
        name: 'you-search',
        arguments: {
          query: 'programming tutorials',
          count: 2,
          safesearch: 'strict',
          freshness: 'month',
        },
      })

      const content = result.content as { type: string; text: string }[]
      expect(content[0]?.text).toContain('programming tutorials')

      const structuredContent = result.structuredContent as SearchStructuredContent
      expect(structuredContent).toHaveProperty('resultCounts')
    },
    { retry: 2 },
  )

  test('mcp client maintains connection across multiple requests', async () => {
    // First request
    const result1 = await mcpClient.callTool({
      name: 'you-search',
      arguments: {
        query: 'test query 1',
        count: 1,
      },
    })

    expect(result1).toHaveProperty('content')

    // Second request - should work without reconnecting
    const result2 = await mcpClient.callTool({
      name: 'you-search',
      arguments: {
        query: 'test query 2',
        count: 1,
      },
    })

    expect(result2).toHaveProperty('content')

    // Both should have succeeded
    const content1 = result1.content as { type: string; text: string }[]
    const content2 = result2.content as { type: string; text: string }[]

    expect(content1[0]?.text).toContain('test query 1')
    expect(content2[0]?.text).toContain('test query 2')
  })

  test('mcp client can list server capabilities', async () => {
    // The client should have received server info during initialization
    // We can verify this by checking that tools are available
    const tools = await mcpClient.listTools()
    expect(tools.tools.length).toBeGreaterThan(0)
  })

  describe('Client IP extraction', () => {
    test('extracts IP from X-Forwarded-For header', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'X-Forwarded-For': '203.0.113.1, 198.51.100.1',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
        }),
      })

      expect(response.status).toBe(200)
      // Client IP is extracted and passed to search tool (tested via integration)
    })

    test('extracts IP from X-Real-IP header when X-Forwarded-For absent', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'X-Real-IP': '203.0.113.1',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
        }),
      })

      expect(response.status).toBe(200)
    })

    test('extracts IP from CF-Connecting-IP header as fallback', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'CF-Connecting-IP': '203.0.113.1',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
        }),
      })

      expect(response.status).toBe(200)
    })

    test('handles missing IP headers gracefully', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
        }),
      })

      expect(response.status).toBe(200)
      // Server handles undefined clientIP gracefully
    })
  })
})
