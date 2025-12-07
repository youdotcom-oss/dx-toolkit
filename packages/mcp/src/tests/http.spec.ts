import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import httpApp from '../http.ts';

// Increase default timeout for hooks to prevent intermittent failures
setDefaultTimeout(15_000);

let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;
const testApiKey = process.env.YDC_API_KEY;

beforeAll(async () => {
  // Start HTTP server on random port
  const port = Math.floor(Math.random() * 10000) + 20000;
  baseUrl = `http://localhost:${port}`;

  // Start actual HTTP server using Bun
  server = Bun.serve({
    port,
    fetch: httpApp.fetch.bind(httpApp),
  });

  // Wait a bit for server to start
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  if (server) {
    server.stop();
    // Wait a bit for server to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});

describe('HTTP Server Endpoints', () => {
  test('health endpoint returns service status', async () => {
    const response = await fetch(`${baseUrl}/mcp-health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = (await response.json()) as {
      status: string;
      timestamp: string;
      version: string;
      service: string;
    };
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('service', 'youdotcom-mcp-server');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.version).toBe('string');
  });

  test('mcp endpoint requires authorization header', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('text/plain');

    const text = await response.text();
    expect(text).toBe('Unauthorized: Authorization header required');
  });

  test('mcp endpoint requires Bearer token format', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'InvalidFormat token123',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('text/plain');

    const text = await response.text();
    expect(text).toBe('Unauthorized: Bearer token required');
  });

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
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    // StreamableHTTPTransport uses SSE format, so response will be streaming
    const text = await response.text();
    expect(text).toContain('data:');
    expect(text).toContain('jsonrpc');
    expect(text).toContain('result');
    expect(text).toContain('protocolVersion');
    expect(text).toContain('capabilities');
  });

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
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data:');
    expect(text).toContain('jsonrpc');
    expect(text).toContain('result');
    expect(text).toContain('protocolVersion');
    expect(text).toContain('capabilities');
  });

  test('mcp endpoint with trailing slash requires authorization', async () => {
    const response = await fetch(`${baseUrl}/mcp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('text/plain');

    const text = await response.text();
    expect(text).toBe('Unauthorized: Authorization header required');
  });
});

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
    });

    // Should get a response (not 401/403), even if the method isn't supported
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);

    // Should be SSE response for StreamableHTTPTransport
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });

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
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    // StreamableHTTPTransport uses SSE format
    const text = await response.text();
    expect(text).toContain('data:');
    expect(text).toContain('jsonrpc');
    expect(text).toContain('123');
  });

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
    });

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
    });

    // Both should be processed (not authentication errors)
    expect(response1.status).not.toBe(401);
    expect(response2.status).not.toBe(401);
  });

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
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    // StreamableHTTPTransport uses SSE format
    const text = await response.text();
    expect(text).toContain('data:');
    expect(text).toContain('jsonrpc');
    expect(text).toContain('42');
  });

  test('mcp server handles search tool request for latest tech news', async () => {
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
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data:');
    expect(text).toContain('jsonrpc');
    expect(text).toContain('result');
    expect(text).toContain('latest tech news');
    expect(text).toContain('Search Results for');
  });
});
