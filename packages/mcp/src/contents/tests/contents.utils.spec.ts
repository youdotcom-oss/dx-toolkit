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

    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('type', 'text')
    expect(result[0]).toHaveProperty('text')

    const text = result[0]?.text
    expect(text).toContain('Example Page')
    expect(text).toContain('https://example.com')
    expect(text).toContain('Formats: markdown')
    expect(text).toContain('# Hello')
    expect(text).toContain('This is a test page with some content.')
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

    const text = result[0]?.text
    expect(text).toContain('Successfully extracted content from 2 URL(s)')
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

    const text = result[0]?.text
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

    const text = result[0]?.text
    expect(text).toContain(longContent)
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

    const text = result[0]?.text
    expect(text).toContain('Empty Page')
  })
})
