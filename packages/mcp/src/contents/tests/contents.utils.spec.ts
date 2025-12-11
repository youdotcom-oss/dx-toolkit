import { describe, expect, test } from 'bun:test';
import type { ContentsApiResponse } from '../contents.schemas.ts';
import { fetchContents, formatContentsResponse } from '../contents.utils.ts';

const getUserAgent = () => 'MCP/test (You.com; test-client)';

// NOTE: The following tests require a You.com API key with access to the Contents API
// Using example.com/example.org as test URLs since You.com blocks self-scraping
describe('fetchContents', () => {
  test(
    'returns valid response structure for single URL',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: ['https://documentation.you.com/developer-resources/mcp-server'],
          format: 'markdown',
        },
        getUserAgent,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const firstItem = result[0];
      expect(firstItem).toBeDefined();

      // Should have markdown content
      expect(firstItem?.markdown).toBeDefined();
      expect(typeof firstItem?.markdown).toBe('string');
    },
    { retry: 2 },
  );

  test(
    'handles multiple URLs',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: [
            'https://documentation.you.com/developer-resources/mcp-server',
            'https://documentation.you.com/developer-resources/python-sdk',
          ],
          format: 'markdown',
        },
        getUserAgent,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      for (const item of result) {
        expect(item).toHaveProperty('url');
        expect(item.markdown).toBeDefined();
      }
    },
    { retry: 2 },
  );

  test(
    'handles html format',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: ['https://documentation.you.com/developer-resources/mcp-server'],
          format: 'html',
        },
        getUserAgent,
      });

      expect(Array.isArray(result)).toBe(true);
      const firstItem = result[0];
      expect(firstItem).toBeDefined();

      expect(firstItem?.html).toBeDefined();
      expect(typeof firstItem?.html).toBe('string');
    },
    { retry: 2 },
  );
});

describe('formatContentsResponse', () => {
  test('formats single markdown content correctly', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Example Page',
        markdown: '# Hello\n\nThis is a test page with some content.',
      },
    ];

    const result = formatContentsResponse(mockResponse, 'markdown');

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('structuredContent');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');

    const text = result.content[0]?.text;
    expect(text).toContain('Example Page');
    expect(text).toContain('https://example.com');
    expect(text).toContain('Format: markdown');
    expect(text).toContain('# Hello');
    expect(text).toContain('This is a test page with some content.');

    expect(result.structuredContent).toHaveProperty('count', 1);
    expect(result.structuredContent).toHaveProperty('format', 'markdown');
    expect(result.structuredContent.items).toHaveLength(1);

    const item = result.structuredContent.items[0];
    expect(item).toBeDefined();

    expect(item).toHaveProperty('url', 'https://example.com');
    expect(item).toHaveProperty('title', 'Example Page');
    expect(item).toHaveProperty('content', '# Hello\n\nThis is a test page with some content.');
    expect(item?.contentLength).toBe('# Hello\n\nThis is a test page with some content.'.length);
  });

  test('formats multiple items correctly', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example1.com',
        title: 'Page 1',
        markdown: 'Content 1',
      },
      {
        url: 'https://example2.com',
        title: 'Page 2',
        markdown: 'Content 2',
      },
    ];

    const result = formatContentsResponse(mockResponse, 'markdown');

    expect(result.structuredContent.count).toBe(2);
    expect(result.structuredContent.items).toHaveLength(2);

    const text = result.content[0]?.text;
    expect(text).toContain('Page 1');
    expect(text).toContain('Page 2');
    expect(text).toContain('https://example1.com');
    expect(text).toContain('https://example2.com');
  });

  test('handles html format', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'HTML Page',
        html: '<html><body><h1>Hello</h1></body></html>',
      },
    ];

    const result = formatContentsResponse(mockResponse, 'html');

    expect(result.structuredContent.format).toBe('html');
    const text = result.content[0]?.text;
    expect(text).toContain('Format: html');
    expect(text).toContain('<html>');
  });

  test('includes full content for long text', () => {
    const longContent = 'a'.repeat(1000);
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Long Page',
        markdown: longContent,
      },
    ];

    const result = formatContentsResponse(mockResponse, 'markdown');

    const text = result.content[0]?.text;
    // Full content should be included (not truncated)
    expect(text).toContain(longContent);

    // Structured content should have full content and correct length
    const item = result.structuredContent.items[0];
    expect(item?.content).toBe(longContent);
    expect(item?.contentLength).toBe(1000);
  });

  test('handles empty content gracefully', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Empty Page',
        markdown: '',
      },
    ];

    const result = formatContentsResponse(mockResponse, 'markdown');

    expect(result.structuredContent.items[0]?.contentLength).toBe(0);
    const text = result.content[0]?.text;
    expect(text).toContain('Empty Page');
    expect(text).toContain('Content Length: 0 characters');
  });
});
