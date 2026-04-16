import { describe, expect, test } from 'bun:test'
import type { SearchResponse } from '@youdotcom-oss/api'
import { formatSearchResults } from '../search.utils.ts'

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
        search_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    }

    const result = formatSearchResults(mockResponse)

    expect(result).toHaveProperty('content')
    expect(result).toHaveProperty('structuredContent')
    expect(result).toHaveProperty('fullResponse')
    expect(Array.isArray(result.content)).toBe(true)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
    expect(result.content[0]?.text).toContain('WEB RESULTS:')
    expect(result.content[0]?.text).toContain('Test Title')
    // URL and page_age should be in text content
    expect(result.content[0]?.text).toContain('URL: https://example.com')
    expect(result.content[0]?.text).toContain('Published: 2023-01-01T00:00:00')
    expect(result.structuredContent).toHaveProperty('resultCounts')
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 1)
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 0)
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 1)
    // All fields should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results')
    expect(result.structuredContent.results?.web).toBeDefined()
    expect(result.structuredContent.results?.web?.length).toBe(1)
    expect(result.structuredContent.results?.web?.[0]).toMatchObject({
      url: 'https://example.com',
      title: 'Test Title',
      page_age: '2023-01-01T00:00:00',
      snippets: ['snippet 1', 'snippet 2'],
    })
    expect(result.fullResponse).toBe(mockResponse)
  })

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
        search_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    }

    const result = formatSearchResults(mockResponse)

    expect(result.content[0]?.text).toContain('NEWS RESULTS:')
    expect(result.content[0]?.text).toContain('News Title')
    expect(result.content[0]?.text).toContain('Published: 2023-01-01T00:00:00')
    // URL and Description should be in text content (routed through formatSearchResultsText)
    expect(result.content[0]?.text).toContain('URL: https://news.com/article')
    expect(result.content[0]?.text).toContain('Description: News description')
    expect(result.structuredContent).toHaveProperty('resultCounts')
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 0)
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 1)
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 1)
    // All fields should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results')
    expect(result.structuredContent.results?.news).toBeDefined()
    expect(result.structuredContent.results?.news?.length).toBe(1)
    expect(result.structuredContent.results?.news?.[0]).toMatchObject({
      url: 'https://news.com/article',
      title: 'News Title',
      page_age: '2023-01-01T00:00:00',
    })
  })

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
        search_uuid: 'test-uuid',
        query: 'test query',
        latency: 0.1,
      },
    }

    const result = formatSearchResults(mockResponse)

    expect(result.content[0]?.text).toContain('WEB RESULTS:')
    expect(result.content[0]?.text).toContain('NEWS RESULTS:')
    expect(result.content[0]?.text).toContain(`=${'='.repeat(49)}`)
    // URLs should be in text content
    expect(result.content[0]?.text).toContain('URL: https://web.com')
    expect(result.content[0]?.text).toContain('URL: https://news.com/article')
    expect(result.structuredContent.resultCounts).toHaveProperty('web', 1)
    expect(result.structuredContent.resultCounts).toHaveProperty('news', 1)
    expect(result.structuredContent.resultCounts).toHaveProperty('total', 2)
    // All fields should be in structuredContent.results
    expect(result.structuredContent).toHaveProperty('results')
    expect(result.structuredContent.results?.web).toBeDefined()
    expect(result.structuredContent.results?.news).toBeDefined()
    expect(result.structuredContent.results?.web?.length).toBe(1)
    expect(result.structuredContent.results?.news?.length).toBe(1)
    expect(result.structuredContent.results?.web?.[0]).toMatchObject({
      url: 'https://web.com',
      title: 'Web Title',
      page_age: '2023-01-01T00:00:00',
      snippets: ['web snippet'],
    })
    expect(result.structuredContent.results?.news?.[0]).toMatchObject({
      url: 'https://news.com/article',
      title: 'News Title',
      page_age: '2023-01-01T00:00:00',
    })
  })

  test('includes contents in structuredContent and text indicator when livecrawl returns page content', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [
          {
            url: 'https://example.com',
            title: 'Livecrawl Title',
            description: 'A page with content',
            snippets: ['snippet'],
            page_age: '2023-01-01T00:00:00',
            authors: [],
            contents: {
              markdown: 'Full page content in markdown format.',
              html: '<p>Full page content in HTML format.</p>',
            },
          },
        ],
        news: [],
      },
      metadata: {
        search_uuid: 'test-uuid',
        query: 'livecrawl test',
        latency: 0.5,
      },
    }

    const result = formatSearchResults(mockResponse)

    // Text content should include the contents indicator
    expect(result.content[0]?.text).toContain('Page content available:')
    expect(result.content[0]?.text).toContain('chars (markdown)')
    expect(result.content[0]?.text).toContain('chars (html)')

    // structuredContent should include contents
    expect(result.structuredContent.results?.web?.[0]).toMatchObject({
      url: 'https://example.com',
      title: 'Livecrawl Title',
      contents: {
        markdown: 'Full page content in markdown format.',
        html: '<p>Full page content in HTML format.</p>',
      },
    })
  })

  test('omits contents when not present in response', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [
          {
            url: 'https://example.com',
            title: 'No Content',
            description: 'A page without livecrawl',
            snippets: ['snippet'],
          },
        ],
        news: [],
      },
      metadata: {
        search_uuid: 'test-uuid',
        query: 'test',
        latency: 0.1,
      },
    }

    const result = formatSearchResults(mockResponse)

    expect(result.content[0]?.text).not.toContain('Page content available:')
    expect(result.structuredContent.results?.web?.[0]?.contents).toBeUndefined()
  })

  test('includes contents indicator for news results with livecrawl', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [],
        news: [
          {
            title: 'News with Content',
            description: 'Breaking news',
            page_age: '2023-01-01T00:00:00',
            url: 'https://news.com/article',
            contents: {
              markdown: 'Full news article content in markdown.',
            },
          },
        ],
      },
      metadata: {
        search_uuid: 'test-uuid',
        query: 'news livecrawl test',
        latency: 0.4,
      },
    }

    const result = formatSearchResults(mockResponse)

    // Text content should include the contents indicator for news too
    expect(result.content[0]?.text).toContain('Page content available:')
    expect(result.content[0]?.text).toContain('chars (markdown)')

    // structuredContent should include contents for news
    expect(result.structuredContent.results?.news?.[0]).toMatchObject({
      url: 'https://news.com/article',
      title: 'News with Content',
      contents: { markdown: 'Full news article content in markdown.' },
    })
  })

  test('includes snippets in structuredContent for web results', () => {
    const mockResponse: SearchResponse = {
      results: {
        web: [
          {
            url: 'https://example.com',
            title: 'With Snippets',
            description: 'Has snippets',
            snippets: ['first snippet', 'second snippet'],
          },
        ],
        news: [],
      },
      metadata: {
        search_uuid: 'test-uuid',
        query: 'test',
        latency: 0.1,
      },
    }

    const result = formatSearchResults(mockResponse)

    expect(result.structuredContent.results?.web?.[0]?.snippets).toEqual(['first snippet', 'second snippet'])
  })
})
