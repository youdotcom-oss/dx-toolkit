import { describe, expect, test } from 'bun:test'
import { ContentsQuerySchema } from '../contents.schemas.ts'

describe('ContentsQuerySchema OpenAPI validation', () => {
  test('accepts valid contents queries', () => {
    const validQueries = [
      { urls: ['https://example.com'] },
      { urls: ['https://example.com'], formats: ['markdown'] },
      { urls: ['https://example.com'], formats: ['html', 'markdown'] },
      { urls: ['https://example.com'], formats: ['markdown', 'metadata'] },
      { urls: ['https://example.com'], formats: ['html', 'markdown', 'metadata'] },
      { urls: ['https://example.com'], format: 'html' }, // Deprecated but still supported
      { urls: ['https://example.com'], crawl_timeout: 30 },
      { urls: ['https://a.com', 'https://b.com', 'https://c.com'], formats: ['markdown'] },
    ]

    for (const validQuery of validQueries) {
      expect(() => ContentsQuerySchema.parse(validQuery)).not.toThrow()
    }
  })

  test('rejects invalid contents queries', () => {
    const invalidQueries = [
      {}, // Missing urls
      { urls: [] }, // Empty urls array
      { urls: ['https://example.com'], formats: ['invalid'] }, // Invalid format
      { urls: ['https://example.com'], crawl_timeout: 0 }, // Timeout too low
      { urls: ['https://example.com'], crawl_timeout: 61 }, // Timeout too high
    ]

    for (const invalidQuery of invalidQueries) {
      expect(() => ContentsQuerySchema.parse(invalidQuery)).toThrow()
    }
  })

  test('accepts metadata format', () => {
    const query = {
      urls: ['https://example.com'],
      formats: ['metadata'],
    }

    expect(() => ContentsQuerySchema.parse(query)).not.toThrow()
  })

  test('accepts all format combinations', () => {
    const formatCombinations = [
      ['html'],
      ['markdown'],
      ['metadata'],
      ['html', 'markdown'],
      ['html', 'metadata'],
      ['markdown', 'metadata'],
      ['html', 'markdown', 'metadata'],
    ]

    for (const formats of formatCombinations) {
      expect(() => ContentsQuerySchema.parse({ urls: ['https://example.com'], formats })).not.toThrow()
    }
  })

  test('crawl_timeout validation', () => {
    // Valid timeouts (1-60)
    const validTimeouts = [1, 30, 60]
    for (const timeout of validTimeouts) {
      expect(() => ContentsQuerySchema.parse({ urls: ['https://example.com'], crawl_timeout: timeout })).not.toThrow()
    }

    // Invalid timeouts
    const invalidTimeouts = [0, -1, 61, 100]
    for (const timeout of invalidTimeouts) {
      expect(() => ContentsQuerySchema.parse({ urls: ['https://example.com'], crawl_timeout: timeout })).toThrow()
    }
  })
})
