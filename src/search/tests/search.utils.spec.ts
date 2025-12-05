import { describe, expect, test } from 'bun:test';
import type { SearchResponse } from '../search.schemas.ts';
import { fetchSearchResults, formatSearchResults } from '../search.utils.ts';

const getUserAgent = () => 'MCP/test (You.com; test-client)';

describe('fetchSearchResults', () => {
  test('returns valid response structure for basic query', async () => {
    const result = await fetchSearchResults({
      searchQuery: { query: 'latest stock news' },
      getUserAgent,
    });

    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('metadata');
    expect(result.results).toHaveProperty('web');
    expect(result.results).toHaveProperty('news');
    expect(Array.isArray(result.results.web)).toBe(true);
    expect(Array.isArray(result.results.news)).toBe(true);

    // Assert required metadata fields
    expect(typeof result.metadata?.query).toBe('string');

    // Optional fields: only assert type if present
    if (result.metadata?.request_uuid !== undefined) {
      expect(typeof result.metadata.request_uuid).toBe('string');
    }
  });

  test('handles search with filters', async () => {
    const result = await fetchSearchResults({
      searchQuery: {
        query: 'javascript tutorial',
        count: 3,
        freshness: 'week',
        country: 'US',
      },
      getUserAgent,
    });

    expect(result.results.web?.length).toBeLessThanOrEqual(3);
    expect(result.metadata?.query).toContain('javascript tutorial');
  });

  test('validates response schema', async () => {
    const result = await fetchSearchResults({
      searchQuery: { query: 'latest technology news' },
      getUserAgent,
    });

    // Test that web results have required properties
    // biome-ignore lint/style/noNonNullAssertion: Test
    const webResult = result.results.web![0];

    expect(webResult).toHaveProperty('url');
    expect(webResult).toHaveProperty('title');
    expect(webResult).toHaveProperty('description');
    expect(webResult).toHaveProperty('snippets');
    expect(Array.isArray(webResult?.snippets)).toBe(true);

    // Test that news results have required properties
    // biome-ignore lint/style/noNonNullAssertion: Test
    const newsResult = result.results.news![0];
    expect(newsResult).toHaveProperty('url');
    expect(newsResult).toHaveProperty('title');
    expect(newsResult).toHaveProperty('description');
    expect(newsResult).toHaveProperty('page_age');
  });
});

describe('formatSearchResults', () => {
  test('formats web results correctly', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [
          {
            url: 'https://example.com',
            title: 'Test Title',
            description: 'Test description',
            snippets: ['snippet 1', 'snippet 2'],
            page_age: '2023-01-01T00:00:00',
            authors: ['Author Name'],
          },
        ],
        news: [],
      },
      metadata: {
        request_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    };

    const result = formatSearchResults(mockResponse);

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('structuredContent');
    expect(result).toHaveProperty('fullResponse');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    expect(result.content[0]?.text).toContain('WEB RESULTS:');
    expect(result.content[0]?.text).toContain('Test Title');
    // URLs should NOT be in text content
    expect(result.content[0]?.text).not.toContain('https://example.com');
    expect(result.structuredContent).toHaveProperty('resultCounts');
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 1);
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 0);
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 1);
    // URLs should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results');
    expect(result.structuredContent.results?.web).toBeDefined();
    expect(result.structuredContent.results?.web?.length).toBe(1);
    expect(result.structuredContent.results?.web?.[0]).toEqual({
      url: 'https://example.com',
      title: 'Test Title',
    });
    expect(result.fullResponse).toBe(mockResponse);
  });

  test('formats news results correctly', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [],
        news: [
          {
            title: 'News Title',
            description: 'News description',
            page_age: '2023-01-01T00:00:00',
            url: 'https://news.com/article',
          },
        ],
      },
      metadata: {
        request_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    };

    const result = formatSearchResults(mockResponse);

    expect(result.content[0]?.text).toContain('NEWS RESULTS:');
    expect(result.content[0]?.text).toContain('News Title');
    expect(result.content[0]?.text).toContain('Published: 2023-01-01T00:00:00');
    // URLs should NOT be in text content
    expect(result.content[0]?.text).not.toContain('https://news.com/article');
    expect(result.structuredContent).toHaveProperty('resultCounts');
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 0);
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 1);
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 1);
    // URLs should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results');
    expect(result.structuredContent.results?.news).toBeDefined();
    expect(result.structuredContent.results?.news?.length).toBe(1);
    expect(result.structuredContent.results?.news?.[0]).toEqual({
      url: 'https://news.com/article',
      title: 'News Title',
    });
  });

  test('formats both web and news results', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [
          {
            url: 'https://web.com',
            title: 'Web Title',
            description: 'Web description',
            snippets: ['web snippet'],
            page_age: '2023-01-01T00:00:00',
            authors: ['Web Author'],
          },
        ],
        news: [
          {
            title: 'News Title',
            description: 'News description',
            page_age: '2023-01-01T00:00:00',
            url: 'https://news.com/article',
          },
        ],
      },
      metadata: {
        request_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    };

    const result = formatSearchResults(mockResponse);

    expect(result.content[0]?.text).toContain('WEB RESULTS:');
    expect(result.content[0]?.text).toContain('NEWS RESULTS:');
    expect(result.content[0]?.text).toContain(`=${'='.repeat(49)}`);
    // URLs should NOT be in text content
    expect(result.content[0]?.text).not.toContain('https://web.com');
    expect(result.content[0]?.text).not.toContain('https://news.com/article');
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 1);
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 1);
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 2);
    // URLs should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results');
    expect(result.structuredContent.results?.web).toBeDefined();
    expect(result.structuredContent.results?.news).toBeDefined();
    expect(result.structuredContent.results?.web?.length).toBe(1);
    expect(result.structuredContent.results?.news?.length).toBe(1);
    expect(result.structuredContent.results?.web?.[0]).toEqual({
      url: 'https://web.com',
      title: 'Web Title',
    });
    expect(result.structuredContent.results?.news?.[0]).toEqual({
      url: 'https://news.com/article',
      title: 'News Title',
    });
  });
});
