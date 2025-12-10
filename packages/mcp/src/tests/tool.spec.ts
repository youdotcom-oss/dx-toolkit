import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { $ } from 'bun';
import type { ContentsStructuredContent } from '../contents/contents.schemas.ts';
import type { SearchStructuredContent } from '../search/search.schemas.ts';

let client: Client;

beforeAll(async () => {
  await $`bun run build`; // 1256
  const transport = new StdioClientTransport({
    command: 'npx',
    args: [Bun.resolveSync('../../bin/stdio', import.meta.dir)],
    env: {
      YDC_API_KEY: process.env.YDC_API_KEY ?? '',
    },
  });

  client = new Client({
    name: 'test-client',
    version: '0.0.1',
  });

  await client.connect(transport);
});

afterAll(async () => {
  await client.close();
});

describe('registerSearchTool', () => {
  test('tool is registered and available', async () => {
    const tools = await client.listTools();

    const searchTool = tools.tools.find((t) => t.name === 'you-search');

    expect(searchTool).toBeDefined();
    expect(searchTool?.title).toBe('Web Search');
    expect(searchTool?.description).toContain('Web and news search');
  });

  test('performs basic search successfully', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'javascript tutorial',
        count: 3,
      },
    });
    const content = result.content as { type: string; text: string }[];
    expect(result).toHaveProperty('content');
    expect(Array.isArray(content)).toBe(true);
    expect(content[0]).toHaveProperty('type', 'text');
    expect(content[0]).toHaveProperty('text');

    const text = content[0]?.text;
    expect(text).toContain('Search Results for');
    expect(text).toContain('javascript tutorial');
    const structuredContent = result.structuredContent as SearchStructuredContent;
    // Should have structured content with minimal format
    expect(result).toHaveProperty('structuredContent');
    expect(structuredContent).toHaveProperty('resultCounts');
    expect(structuredContent.resultCounts).toHaveProperty('web');
    expect(structuredContent.resultCounts).toHaveProperty('news');
    expect(structuredContent.resultCounts).toHaveProperty('total');
  });

  test('handles search with web results formatting', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'react components',
        count: 2,
      },
    });

    const content = result.content as { type: string; text: string }[];
    const text = content[0]?.text;
    expect(text).toContain('WEB RESULTS:');
    expect(text).toContain('Title:');
    // URL should NOT be in text content anymore
    expect(text).not.toContain('URL:');
    expect(text).toContain('Description:');
    expect(text).toContain('Snippets:');

    // Verify structured data has result counts
    const structuredContent = result.structuredContent as SearchStructuredContent;
    expect(structuredContent.resultCounts.web).toBeGreaterThan(0);
    expect(structuredContent.resultCounts.total).toBeGreaterThan(0);

    // URLs should be in structuredContent.results
    expect(structuredContent.results).toBeDefined();
    expect(structuredContent.results?.web).toBeDefined();
    expect(structuredContent.results?.web?.length).toBeGreaterThan(0);
    expect(structuredContent.results?.web?.[0]).toHaveProperty('url');
    expect(structuredContent.results?.web?.[0]).toHaveProperty('title');
  });

  test('handles search with news results', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'technology news',
        count: 2,
      },
    });

    const content = result.content as { type: string; text: string }[];
    const text = content[0]?.text;

    const structuredContent = result.structuredContent as SearchStructuredContent;
    // Check if news results are included
    if (structuredContent.resultCounts.news > 0) {
      expect(text).toContain('NEWS RESULTS:');
      expect(text).toContain('Published:');
      expect(structuredContent.resultCounts.news).toBeGreaterThan(0);
    }
  });

  test('handles mixed web and news results with proper separation', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'artificial intelligence',
        count: 3,
      },
    });

    const content = result.content as { type: string; text: string }[];
    const text = content[0]?.text;

    // Should have web results
    expect(text).toContain('WEB RESULTS:');

    const structuredContent = result.structuredContent as SearchStructuredContent;
    // If both web and news results exist, check for separator
    if (structuredContent.resultCounts.news > 0) {
      expect(text).toContain('NEWS RESULTS:');
      expect(text).toContain('='.repeat(50));
    }
  });

  test('handles freshness parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'recent news',
        freshness: 'week',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]).toHaveProperty('text');
    expect(content[0]?.text).toContain('recent news');
  });

  test('handles country parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'local news',
        country: 'US',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]).toHaveProperty('text');
    expect(content[0]?.text).toContain('local news');
  });

  test('handles safesearch parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'educational content',
        safesearch: 'strict',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]).toHaveProperty('text');
    expect(content[0]?.text).toContain('educational content');
  });

  test('handles site parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'react components',
        site: 'github.com',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('react components');
  });

  test('handles fileType parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'documentation',
        filetype: 'pdf',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('documentation');
  });

  test('handles language parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'tutorial',
        language: 'es',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('tutorial');
  });

  test('handles exactTerms parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'programming',
        exactTerms: 'javascript|typescript',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('programming');
  });

  test('handles excludeTerms parameter', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'tutorial',
        excludeTerms: 'beginner|basic',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('tutorial');
  });

  test('handles multi-word phrases with parentheses in exactTerms', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'programming',
        exactTerms: '(machine learning)|typescript',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('programming');
  });

  test('handles multi-word phrases with parentheses in excludeTerms', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'programming',
        excludeTerms: '(social media)|ads',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('programming');
  });

  test('handles complex search with multiple parameters', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'machine learning tutorial',
        count: 5,
        offset: 1,
        freshness: 'month',
        country: 'US',
        safesearch: 'moderate',
        site: 'github.com',
        fileType: 'md',
        language: 'en',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]).toHaveProperty('text');
    // Test should pass even if no results (very specific query might have no results)

    // Verify results are limited by count if there are results
    const structuredContent = result.structuredContent as SearchStructuredContent;
    if (structuredContent.resultCounts.web > 0) {
      expect(structuredContent.resultCounts.web).toBeLessThanOrEqual(5);
    }
  });

  test('handles special characters in query', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'C++ programming "hello world"',
      },
    });

    const content = result.content as { type: string; text: string }[];
    expect(content[0]).toHaveProperty('text');
    expect(content[0]?.text).toContain('C++');
  });

  test('handles empty search results gracefully', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: '_',
      },
    });

    const content = result.content as { type: string; text: string }[];

    // Should still have content even if no results
    expect(content[0]).toHaveProperty('text');

    const text = content[0]?.text;
    const structuredContent = result.structuredContent as SearchStructuredContent;
    expect(structuredContent.resultCounts.web).toBe(0);
    expect(structuredContent.resultCounts.news).toBe(0);
    expect(structuredContent.resultCounts.total).toBe(0);
    expect(text).toContain('No results found');
  });

  test('validates structured response format', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: `what's the latest tech news`,
        count: 2,
      },
    });

    const structuredContent = result.structuredContent as SearchStructuredContent;
    // Validate minimal structured content schema
    expect(structuredContent).toHaveProperty('resultCounts');

    // Check result counts structure
    const resultCounts = structuredContent.resultCounts;
    expect(resultCounts).toHaveProperty('web');
    expect(resultCounts).toHaveProperty('news');
    expect(resultCounts).toHaveProperty('total');
    expect(typeof resultCounts.web).toBe('number');
    expect(typeof resultCounts.news).toBe('number');
    expect(typeof resultCounts.total).toBe('number');
    expect(resultCounts.total).toBe(resultCounts.web + resultCounts.news);
  });

  test('returns error when both exactTerms and excludeTerms are provided', async () => {
    const result = await client.callTool({
      name: 'you-search',
      arguments: {
        query: 'programming',
        exactTerms: 'javascript',
        excludeTerms: 'beginner',
      },
    });

    expect(result.isError).toBe(true);
    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain('Cannot specify both exactTerms and excludeTerms - please use only one');
  });

  test('handles API errors gracefully', async () => {
    try {
      await client.callTool({
        name: 'you-search',
        arguments: {
          query: undefined,
        },
      });
    } catch (error) {
      // If it errors, that's also acceptable behavior
      expect(error).toBeDefined();
    }
  });

  test.skip('handles network timeout scenarios', async () => {
    // TODO: How do we test this?
  });
});

// NOTE: The following tests require a You.com API key with access to the Contents API
// Using example.com and Wikipedia URLs that work with the Contents API
describe('registerContentsTool', () => {
  test('tool is registered and available', async () => {
    const tools = await client.listTools();

    const contentsTool = tools.tools.find((t) => t.name === 'you-contents');

    expect(contentsTool).toBeDefined();
    expect(contentsTool?.title).toBe('Extract Web Page Contents');
    expect(contentsTool?.description).toContain('Extract page content');
  });

  test('extracts content from a single URL', async () => {
    const result = await client.callTool({
      name: 'you-contents',
      arguments: {
        urls: ['https://documentation.you.com/developer-resources/mcp-server'],
        format: 'markdown',
      },
    });

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('structuredContent');

    const content = result.content as { type: string; text: string }[];
    expect(Array.isArray(content)).toBe(true);
    expect(content[0]).toHaveProperty('type', 'text');
    expect(content[0]).toHaveProperty('text');

    const text = content[0]?.text;
    expect(text).toContain('Successfully extracted content');
    expect(text).toContain('https://documentation.you.com/developer-resources/mcp-server');
    expect(text).toContain('Format: markdown');

    const structuredContent = result.structuredContent as ContentsStructuredContent;
    expect(structuredContent).toHaveProperty('count', 1);
    expect(structuredContent).toHaveProperty('format', 'markdown');
    expect(structuredContent).toHaveProperty('items');
    expect(structuredContent.items).toHaveLength(1);

    const item = structuredContent.items[0];
    expect(item).toBeDefined();

    expect(item).toHaveProperty('url', 'https://documentation.you.com/developer-resources/mcp-server');
    expect(item).toHaveProperty('content');
    expect(item).toHaveProperty('contentLength');
    expect(typeof item?.content).toBe('string');
    expect(item?.content.length).toBeGreaterThan(0);
  });

  test('extracts content from multiple URLs', async () => {
    const result = await client.callTool({
      name: 'you-contents',
      arguments: {
        urls: [
          'https://documentation.you.com/developer-resources/mcp-server',
          'https://documentation.you.com/developer-resources/python-sdk',
        ],
        format: 'markdown',
      },
    });

    const structuredContent = result.structuredContent as ContentsStructuredContent;
    expect(structuredContent.count).toBe(2);
    expect(structuredContent.items).toHaveLength(2);

    const content = result.content as { type: string; text: string }[];
    const text = content[0]?.text;
    expect(text).toContain('Successfully extracted content from 2 URL(s)');
  });

  test('handles html format', async () => {
    const result = await client.callTool({
      name: 'you-contents',
      arguments: {
        urls: ['https://documentation.you.com/developer-resources/mcp-server'],
        format: 'html',
      },
    });

    const structuredContent = result.structuredContent as ContentsStructuredContent;
    expect(structuredContent.format).toBe('html');

    const content = result.content as { type: string; text: string }[];
    const text = content[0]?.text;
    expect(text).toContain('Format: html');
  });

  test('defaults to markdown format when not specified', async () => {
    const result = await client.callTool({
      name: 'you-contents',
      arguments: {
        urls: ['https://documentation.you.com/developer-resources/mcp-server'],
      },
    });

    const structuredContent = result.structuredContent as ContentsStructuredContent;
    expect(structuredContent.format).toBe('markdown');
  });
});
