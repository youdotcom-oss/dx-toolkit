import { beforeAll, describe, expect, test } from 'bun:test';

/**
 * Integration tests for n8n YouDotCom node
 *
 * These tests verify that the You.com APIs work correctly with the parameters
 * and response handling defined in the n8n node. They call the real APIs
 * to ensure the node will function properly when deployed.
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key (required)
 *
 * Note: The @youdotcom-oss/mcp package has comprehensive API tests.
 * These tests focus on verifying the specific parameter combinations
 * and response structures used by the n8n node.
 */

// API endpoints (must match MCP package constants)
const SEARCH_API_URL = 'https://ydc-index.io/v1/search';
const CONTENTS_API_URL = 'https://ydc-index.io/v1/contents';
const EXPRESS_API_URL = 'https://api.you.com/v1/agents/runs';

describe('n8n Node Integration Tests', () => {
  let apiKey: string;

  beforeAll(() => {
    const key = process.env.YDC_API_KEY;
    if (!key) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests');
    }
    apiKey = key;
  });

  describe('Search Operation', () => {
    test(
      'basic search returns expected structure',
      async () => {
        const response = await fetch(`${SEARCH_API_URL}?query=TypeScript&count=3`, {
          headers: {
            'X-API-Key': apiKey,
            Accept: 'application/json',
          },
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Verify response structure matches what n8n node expects
        expect(data).toHaveProperty('results');
        expect(data.results).toHaveProperty('web');
        expect(Array.isArray(data.results.web)).toBe(true);
        expect(data.results.web.length).toBeGreaterThan(0);

        // Verify web result structure
        const firstResult = data.results.web[0];
        expect(firstResult).toHaveProperty('url');
        expect(firstResult).toHaveProperty('title');
        expect(firstResult).toHaveProperty('description');
        expect(typeof firstResult.url).toBe('string');
        expect(typeof firstResult.title).toBe('string');
      },
      { timeout: 30_000 },
    );

    test(
      'search with filters works correctly',
      async () => {
        const params = new URLSearchParams({
          query: 'AI news',
          count: '5',
          freshness: 'week',
          safesearch: 'moderate',
        });

        const response = await fetch(`${SEARCH_API_URL}?${params}`, {
          headers: {
            'X-API-Key': apiKey,
            Accept: 'application/json',
          },
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        expect(data.results).toBeDefined();
        expect(data.results.web || data.results.news).toBeDefined();
      },
      { timeout: 30_000 },
    );

    test(
      'search with site filter accepts parameter',
      async () => {
        const params = new URLSearchParams({
          query: 'readme',
          count: '5',
          site: 'github.com',
        });

        const response = await fetch(`${SEARCH_API_URL}?${params}`, {
          headers: {
            'X-API-Key': apiKey,
            Accept: 'application/json',
          },
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        expect(data.results).toBeDefined();
        // Site filter is a hint to the search engine, results should exist
        expect(data.results.web || data.results.news).toBeDefined();
      },
      { timeout: 30_000 },
    );
  });

  describe('Contents Operation', () => {
    test(
      'extracts content from single URL',
      async () => {
        const response = await fetch(CONTENTS_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            urls: ['https://example.com'],
            formats: ['markdown'],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Verify response is an array (n8n node expects this)
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        // Verify content item structure
        const firstItem = data[0];
        expect(firstItem).toHaveProperty('url');
      },
      { timeout: 30_000 },
    );

    test(
      'handles multiple URLs',
      async () => {
        const response = await fetch(CONTENTS_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            urls: ['https://example.com', 'https://example.org'],
            formats: ['markdown'],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Should return results for both URLs
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(2);
      },
      { timeout: 45_000 },
    );

    test(
      'extracts multiple formats',
      async () => {
        const response = await fetch(CONTENTS_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            urls: ['https://example.com'],
            formats: ['markdown', 'html', 'metadata'],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        const firstItem = data[0];
        expect(firstItem).toHaveProperty('url');

        // Should have content for requested formats
        // Note: Not all formats may be available for every URL
        const hasAnyFormat = firstItem.markdown || firstItem.html || firstItem.metadata;
        expect(hasAnyFormat).toBeTruthy();
      },
      { timeout: 30_000 },
    );
  });

  describe('Express Operation', () => {
    test(
      'returns AI answer with web search',
      async () => {
        const response = await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            agent: 'express',
            input: 'What is TypeScript?',
            stream: false,
            tools: [{ type: 'web_search' }],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Verify response structure matches what n8n node expects
        expect(data).toHaveProperty('output');
        expect(Array.isArray(data.output)).toBe(true);

        // Should have an answer in the output
        const answerItem = data.output.find((item: { type: string }) => item.type === 'message.answer');
        expect(answerItem).toBeDefined();
        expect(answerItem.text).toBeDefined();
        expect(typeof answerItem.text).toBe('string');
        expect(answerItem.text.length).toBeGreaterThan(10);

        // Should have search results when web_search tool is used
        const searchItem = data.output.find((item: { type: string }) => item.type === 'web_search.results');
        expect(searchItem).toBeDefined();
        expect(searchItem.content).toBeDefined();
        expect(Array.isArray(searchItem.content)).toBe(true);
      },
      { timeout: 60_000 },
    );

    test(
      'answer contains relevant content',
      async () => {
        const response = await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            agent: 'express',
            input: 'What is the capital of France?',
            stream: false,
            tools: [{ type: 'web_search' }],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        const answerItem = data.output.find((item: { type: string }) => item.type === 'message.answer');
        expect(answerItem?.text?.toLowerCase()).toContain('paris');
      },
      { timeout: 60_000 },
    );

    test(
      'search results have expected structure',
      async () => {
        const response = await fetch(EXPRESS_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            agent: 'express',
            input: 'Latest news about artificial intelligence',
            stream: false,
            tools: [{ type: 'web_search' }],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        const searchItem = data.output.find((item: { type: string }) => item.type === 'web_search.results');
        if (searchItem?.content?.length > 0) {
          const firstResult = searchItem.content[0];
          expect(firstResult).toHaveProperty('url');
          expect(firstResult).toHaveProperty('title');
          expect(firstResult).toHaveProperty('snippet');
        }
      },
      { timeout: 60_000 },
    );
  });

  describe('Error Handling', () => {
    test('invalid API key returns 401 or 403', async () => {
      const response = await fetch(`${SEARCH_API_URL}?query=test`, {
        headers: {
          'X-API-Key': 'invalid-key',
          Accept: 'application/json',
        },
      });

      // API returns 401 or 403 for invalid credentials
      expect([401, 403]).toContain(response.status);
    });

    test('missing query parameter returns error', async () => {
      const response = await fetch(SEARCH_API_URL, {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
      });

      // API returns 4xx for missing required parameter
      expect(response.ok).toBe(false);
      expect([400, 422]).toContain(response.status);
    });

    test('contents with empty urls returns error', async () => {
      const response = await fetch(CONTENTS_API_URL, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          urls: [],
          formats: ['markdown'],
        }),
      });

      // API should return 400 for empty urls
      expect(response.ok).toBe(false);
      expect([400, 422]).toContain(response.status);
    });
  });
});
