import { describe, expect, setDefaultTimeout, test } from 'bun:test';
import type { ExpressAgentMcpResponse } from '../express.schemas.ts';
import { callExpressAgent, formatExpressAgentResponse } from '../express.utils.ts';

const getUserAgent = () => 'MCP/test (You.com; test-client)';

setDefaultTimeout(20_000);

describe('callExpressAgent', () => {
  test('returns answer only (WITHOUT web_search tools)', async () => {
    const result = await callExpressAgent({
      agentInput: { input: 'What is machine learning?' },
      getUserAgent,
    });

    // Verify MCP response structure
    expect(result).toHaveProperty('answer');
    expect(typeof result.answer).toBe('string');
    expect(result.answer.length).toBeGreaterThan(0);

    // Should NOT have results when web_search is not used
    expect(result.results).toBeUndefined();

    expect(result.agent).toBe('express');
  });

  test('returns answer and search results (WITH web_search tools)', async () => {
    const result = await callExpressAgent({
      agentInput: {
        input: 'Latest developments in quantum computing',
        tools: [{ type: 'web_search' }],
      },
      getUserAgent,
    });

    // Verify MCP response has both answer and results
    expect(result).toHaveProperty('answer');
    expect(typeof result.answer).toBe('string');
    expect(result.answer.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('results');
    expect(result.results).toHaveProperty('web');
    expect(Array.isArray(result.results?.web)).toBe(true);
    expect(result.results?.web.length).toBeGreaterThan(0);

    // Verify each search result has required fields
    const firstResult = result.results?.web[0];
    expect(firstResult).toHaveProperty('url');
    expect(firstResult).toHaveProperty('title');
    expect(firstResult).toHaveProperty('snippet');
    expect(typeof firstResult?.url).toBe('string');
    expect(typeof firstResult?.title).toBe('string');
    expect(typeof firstResult?.snippet).toBe('string');
    expect(firstResult?.url.length).toBeGreaterThan(0);
    expect(firstResult?.title.length).toBeGreaterThan(0);

    expect(result.agent).toBe('express');
  }, 30000);

  test('works without optional parameters', async () => {
    const result = await callExpressAgent({
      agentInput: { input: 'What is the capital of France?' },
      getUserAgent,
      // No progressToken or sendProgress provided
    });

    // Should work normally without progress tracking
    expect(result).toHaveProperty('answer');
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.agent).toBe('express');
  });
});

describe('formatExpressAgentResponse', () => {
  test('formats response with answer only (no search results)', () => {
    const mockResponse: ExpressAgentMcpResponse = {
      answer: 'The capital of France is Paris.',
      agent: 'express',
    };

    const result = formatExpressAgentResponse(mockResponse);

    // Verify content array has 1 item (answer only)
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBe(1);

    // Verify answer content
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    expect(result.content[0]?.text).toContain('Express Agent Answer');
    expect(result.content[0]?.text).toContain('The capital of France is Paris.');

    // Verify structuredContent is minimal (not full response)
    expect(result).toHaveProperty('structuredContent');
    expect(result).toHaveProperty('fullResponse');
    expect(result.structuredContent).toHaveProperty('answer');
    expect(result.structuredContent).toHaveProperty('hasResults');
    expect(result.structuredContent).toHaveProperty('resultCount');
    expect(result.structuredContent).toHaveProperty('agent');
    expect(result.structuredContent.answer).toBe(mockResponse.answer);
    expect(result.structuredContent.hasResults).toBe(false);
    expect(result.structuredContent.resultCount).toBe(0);
    // No results, so results field should be undefined
    expect(result.structuredContent.results).toBeUndefined();
    expect(result.fullResponse).toEqual(mockResponse);
  });

  test('formats response with answer and search results', () => {
    const mockResponse: ExpressAgentMcpResponse = {
      answer: 'Quantum computing is advancing rapidly with recent breakthroughs in error correction.',
      results: {
        web: [
          {
            url: 'https://example.com/quantum1',
            title: 'Quantum Computing Breakthrough',
            snippet: 'Scientists achieve quantum error correction milestone.',
          },
          {
            url: 'https://example.com/quantum2',
            title: 'Latest in Quantum Research',
            snippet: 'New quantum processor demonstrates superiority.',
          },
        ],
      },
      agent: 'express',
    };

    const result = formatExpressAgentResponse(mockResponse);

    // Verify content array has 2 items (answer + search results)
    expect(result.content.length).toBe(2);

    // Verify answer comes FIRST
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toContain('Express Agent Answer');
    expect(result.content[0]?.text).toContain('Quantum computing is advancing rapidly');

    // Verify search results come SECOND (without URLs in text)
    expect(result.content[1]?.type).toBe('text');
    expect(result.content[1]?.text).toContain('Search Results');
    expect(result.content[1]?.text).toContain('Quantum Computing Breakthrough');
    expect(result.content[1]?.text).toContain('Latest in Quantum Research');
    // URLs should NOT be in text content
    expect(result.content[1]?.text).not.toContain('https://example.com/quantum1');
    expect(result.content[1]?.text).not.toContain('https://example.com/quantum2');

    // Verify structuredContent is minimal with counts
    expect(result.structuredContent).toHaveProperty('answer');
    expect(result.structuredContent).toHaveProperty('hasResults');
    expect(result.structuredContent).toHaveProperty('resultCount');
    expect(result.structuredContent.answer).toBe(mockResponse.answer);
    expect(result.structuredContent.hasResults).toBe(true);
    expect(result.structuredContent.resultCount).toBe(2);

    // URLs should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results');
    expect(result.structuredContent.results?.web).toBeDefined();
    expect(result.structuredContent.results?.web?.length).toBe(2);
    expect(result.structuredContent.results?.web?.[0]).toEqual({
      url: 'https://example.com/quantum1',
      title: 'Quantum Computing Breakthrough',
    });
    expect(result.structuredContent.results?.web?.[1]).toEqual({
      url: 'https://example.com/quantum2',
      title: 'Latest in Quantum Research',
    });

    // Verify fullResponse has complete data
    expect(result.fullResponse).toEqual(mockResponse);
    expect(result.fullResponse.results?.web).toHaveLength(2);
  });

  test('structuredContent validation for answer only', () => {
    const mockResponse: ExpressAgentMcpResponse = {
      answer: 'Neural networks are computational models inspired by biological neurons.',
      agent: 'express',
    };

    const result = formatExpressAgentResponse(mockResponse);

    // Verify structure matches minimal schema
    expect(result.structuredContent).toMatchObject({
      answer: expect.any(String),
      hasResults: false,
      resultCount: 0,
      agent: 'express',
    });

    // Verify fullResponse has complete data
    expect(result.fullResponse.results).toBeUndefined();
  });

  test('structuredContent validation for answer with results', () => {
    const mockResponse: ExpressAgentMcpResponse = {
      answer: 'Recent AI breakthroughs include advances in language models and computer vision.',
      results: {
        web: [
          {
            url: 'https://example.com/ai-breakthrough',
            title: 'AI Breakthrough 2025',
            snippet: 'Major advances in artificial intelligence.',
          },
        ],
      },
      agent: 'express',
    };

    const result = formatExpressAgentResponse(mockResponse);

    // Verify structuredContent is minimal with counts
    expect(result.structuredContent).toHaveProperty('answer');
    expect(result.structuredContent).toHaveProperty('hasResults');
    expect(result.structuredContent).toHaveProperty('resultCount');
    expect(result.structuredContent).toHaveProperty('agent');
    expect(result.structuredContent.answer).toBe(
      'Recent AI breakthroughs include advances in language models and computer vision.',
    );
    expect(result.structuredContent.agent).toBe('express');
    expect(result.structuredContent.hasResults).toBe(true);
    expect(result.structuredContent.resultCount).toBe(1);

    // URLs should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results');
    expect(result.structuredContent.results?.web).toBeDefined();
    expect(result.structuredContent.results?.web?.length).toBe(1);
    expect(result.structuredContent.results?.web?.[0]).toEqual({
      url: 'https://example.com/ai-breakthrough',
      title: 'AI Breakthrough 2025',
    });

    // Verify fullResponse has complete search results
    expect(result.fullResponse).toEqual(mockResponse);
    expect(result.fullResponse.results).toBeDefined();
    expect(Array.isArray(result.fullResponse.results?.web)).toBe(true);
    expect(result.fullResponse.results?.web.length).toBe(1);

    // Verify search result fields in fullResponse
    const searchResult = result.fullResponse.results?.web[0];
    expect(searchResult?.url).toBe('https://example.com/ai-breakthrough');
    expect(searchResult?.title).toBe('AI Breakthrough 2025');
    expect(searchResult?.snippet).toBe('Major advances in artificial intelligence.');
  });
});
