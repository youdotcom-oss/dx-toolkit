import { describe, expect, test } from 'bun:test'
import { formatSearchResultsText } from '../format-search-results-text.ts'

describe('formatSearchResultsText', () => {
  test('formats basic search results with title and URL', () => {
    const results = [
      {
        url: 'https://example.com',
        title: 'Example Title',
      },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Title: Example Title')
    expect(formatted).toContain('URL: https://example.com')
  })

  test('includes page_age when present', () => {
    const results = [
      {
        url: 'https://example.com',
        title: 'Example',
        page_age: '2024-01-15T10:00:00Z',
      },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Published: 2024-01-15T10:00:00Z')
  })

  test('includes description when present', () => {
    const results = [
      {
        url: 'https://example.com',
        title: 'Example',
        description: 'A test description',
      },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Description: A test description')
  })

  test('includes snippets array when present', () => {
    const results = [
      {
        url: 'https://example.com',
        title: 'Example',
        snippets: ['Snippet one', 'Snippet two'],
      },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Snippets:')
    expect(formatted).toContain('- Snippet one')
    expect(formatted).toContain('- Snippet two')
  })

  test('includes single snippet when present', () => {
    const results = [
      {
        url: 'https://example.com',
        title: 'Example',
        snippet: 'Single snippet text',
      },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Snippet: Single snippet text')
  })

  test('formats multiple results with separator', () => {
    const results = [
      { url: 'https://a.com', title: 'Title A' },
      { url: 'https://b.com', title: 'Title B' },
    ]
    const formatted = formatSearchResultsText(results)
    expect(formatted).toContain('Title A')
    expect(formatted).toContain('Title B')
    // Results should be separated by double newlines
    const parts = formatted.split('\n\n')
    expect(parts.length).toBeGreaterThan(1)
  })

  test('handles empty results array', () => {
    const results: Array<{ url: string; title: string }> = []
    const formatted = formatSearchResultsText(results)
    expect(formatted).toBe('')
  })
})
