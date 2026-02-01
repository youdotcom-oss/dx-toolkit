import { describe, expect, test } from 'bun:test'
import type { ContentsApiResponse } from '@youdotcom-oss/api'
import { formatContentsResponse } from '../contents.utils.ts'

describe('formatContentsResponse', () => {
  test('formats single markdown content correctly', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Example Page',
        markdown: '# Hello\n\nThis is a test page with some content.',
      },
    ]

    const result = formatContentsResponse(mockResponse, ['markdown'])

    expect(result).toHaveProperty('content')
    expect(result).toHaveProperty('structuredContent')
    expect(Array.isArray(result.content)).toBe(true)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')

    const text = result.content[0]?.text
    expect(text).toContain('Example Page')
    expect(text).toContain('https://example.com')
    expect(text).toContain('Formats: markdown')
    expect(text).toContain('# Hello')
    expect(text).toContain('This is a test page with some content.')

    expect(result.structuredContent).toHaveProperty('count', 1)
    expect(result.structuredContent).toHaveProperty('formats')
    expect(result.structuredContent.formats).toEqual(['markdown'])
    expect(result.structuredContent.items).toHaveLength(1)

    const item = result.structuredContent.items[0]
    expect(item).toBeDefined()

    expect(item).toHaveProperty('url', 'https://example.com')
    expect(item).toHaveProperty('title', 'Example Page')
    expect(item).toHaveProperty('markdown', '# Hello\n\nThis is a test page with some content.')
  })

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
    ]

    const result = formatContentsResponse(mockResponse, ['markdown'])

    expect(result.structuredContent.count).toBe(2)
    expect(result.structuredContent.items).toHaveLength(2)

    const text = result.content[0]?.text
    expect(text).toContain('Page 1')
    expect(text).toContain('Page 2')
    expect(text).toContain('https://example1.com')
    expect(text).toContain('https://example2.com')
  })

  test('handles html format', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'HTML Page',
        html: '<html><body><h1>Hello</h1></body></html>',
      },
    ]

    const result = formatContentsResponse(mockResponse, ['html'])

    expect(result.structuredContent.formats).toEqual(['html'])
    const text = result.content[0]?.text
    expect(text).toContain('Formats: html')
    expect(text).toContain('<html>')
  })

  test('includes full content for long text', () => {
    const longContent = 'a'.repeat(1000)
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Long Page',
        markdown: longContent,
      },
    ]

    const result = formatContentsResponse(mockResponse, ['markdown'])

    const text = result.content[0]?.text
    // Full content should be included (not truncated)
    expect(text).toContain(longContent)

    // Structured content should have full markdown content
    const item = result.structuredContent.items[0]
    expect(item?.markdown).toBe(longContent)
  })

  test('handles empty content gracefully', () => {
    const mockResponse: ContentsApiResponse = [
      {
        url: 'https://example.com',
        title: 'Empty Page',
        markdown: '',
      },
    ]

    const result = formatContentsResponse(mockResponse, ['markdown'])

    expect(result.structuredContent.items[0]?.markdown).toBe('')
    const text = result.content[0]?.text
    expect(text).toContain('Empty Page')
    // Empty content should still be handled gracefully
  })
})
