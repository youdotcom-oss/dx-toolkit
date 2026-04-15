import { describe, expect, test } from 'bun:test'
import { formatSearchResultsText } from '../format-search-results-text.ts'

describe('formatSearchResultsText', () => {
  test('formats basic search results with title and URL', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test' }])

    expect(result).toContain('Title: Test')
    expect(result).toContain('URL: https://example.com')
  })

  test('includes page_age when present', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test', page_age: '2023-01-01' }])

    expect(result).toContain('Published: 2023-01-01')
  })

  test('includes description when present', () => {
    const result = formatSearchResultsText([
      { url: 'https://example.com', title: 'Test', description: 'A description' },
    ])

    expect(result).toContain('Description: A description')
  })

  test('includes snippets array when present', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test', snippets: ['one', 'two'] }])

    expect(result).toContain('Snippets:')
    expect(result).toContain('- one')
    expect(result).toContain('- two')
  })

  test('includes single snippet when present', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test', snippet: 'a snippet' }])

    expect(result).toContain('Snippet: a snippet')
  })

  test('formats multiple results with separator', () => {
    const result = formatSearchResultsText([
      { url: 'https://a.com', title: 'A' },
      { url: 'https://b.com', title: 'B' },
    ])

    expect(result).toContain('Title: A')
    expect(result).toContain('Title: B')
    expect(result).toContain('\n\n')
  })

  test('handles empty results array', () => {
    const result = formatSearchResultsText([])

    expect(result).toBe('')
  })

  test('includes contents indicator when markdown content is present', () => {
    const result = formatSearchResultsText([
      {
        url: 'https://example.com',
        title: 'Test',
        contents: { markdown: 'A'.repeat(4523) },
      },
    ])

    expect(result).toContain('Page content available:')
    expect(result).toContain('4,523 chars (markdown)')
  })

  test('includes contents indicator for both markdown and html', () => {
    const result = formatSearchResultsText([
      {
        url: 'https://example.com',
        title: 'Test',
        contents: { markdown: 'markdown content', html: '<p>html content</p>' },
      },
    ])

    expect(result).toContain('Page content available:')
    expect(result).toContain('chars (markdown)')
    expect(result).toContain('chars (html)')
  })

  test('omits contents indicator when contents object has no content', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test', contents: {} }])

    expect(result).not.toContain('Page content available:')
  })

  test('omits contents indicator when contents is not present', () => {
    const result = formatSearchResultsText([{ url: 'https://example.com', title: 'Test' }])

    expect(result).not.toContain('Page content available:')
  })
})
