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

    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('type', 'text')
    expect(result[0]).toHaveProperty('text')
    expect(result[0]?.text).toContain('WEB RESULTS:')
    expect(result[0]?.text).toContain('Test Title')
    expect(result[0]?.text).toContain('URL: https://example.com')
    expect(result[0]?.text).toContain('Published: 2023-01-01T00:00:00')
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

    expect(result[0]?.text).toContain('NEWS RESULTS:')
    expect(result[0]?.text).toContain('News Title')
    expect(result[0]?.text).toContain('Published: 2023-01-01T00:00:00')
    expect(result[0]?.text).toContain('URL: https://news.com/article')
    expect(result[0]?.text).toContain('Description: News description')
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

    expect(result[0]?.text).toContain('WEB RESULTS:')
    expect(result[0]?.text).toContain('NEWS RESULTS:')
    expect(result[0]?.text).toContain(`=${'='.repeat(49)}`)
    expect(result[0]?.text).toContain('URL: https://web.com')
    expect(result[0]?.text).toContain('URL: https://news.com/article')
  })

  test('includes page content indicator when livecrawl returns contents', () => {
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

    expect(result[0]?.text).toContain('Page content available:')
    expect(result[0]?.text).toContain('chars (markdown)')
    expect(result[0]?.text).toContain('chars (html)')
  })

  test('omits content indicator when livecrawl contents absent', () => {
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

    expect(result[0]?.text).not.toContain('Page content available:')
  })

  test('includes content indicator for news results with livecrawl', () => {
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

    expect(result[0]?.text).toContain('Page content available:')
    expect(result[0]?.text).toContain('chars (markdown)')
  })
})
