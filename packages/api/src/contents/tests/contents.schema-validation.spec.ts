import { describe, expect, test } from 'bun:test'
import { ContentsQuerySchema } from '../contents.schemas.ts'

const OPENAPI_SPEC_URL = 'https://you.com/specs/openapi_contents.yaml'

type ContentsOpenApiSpec = {
  paths: {
    '/v1/contents': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  crawl_timeout: { minimum: number; maximum: number }
                }
              }
            }
          }
        }
      }
    }
  }
  components: {
    schemas: {
      ContentsFormats: { items: { enum: string[] } }
    }
  }
}

const fetchContentsSpec = async (): Promise<ContentsOpenApiSpec> => {
  const response = await fetch(OPENAPI_SPEC_URL)
  const text = await response.text()
  return Bun.YAML.parse(text) as ContentsOpenApiSpec
}

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
      { urls: ['not-a-url'] }, // Invalid URL
      { urls: [''] }, // Empty URL string
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
    const validTimeouts = [1, 30, 60]
    for (const timeout of validTimeouts) {
      expect(() => ContentsQuerySchema.parse({ urls: ['https://example.com'], crawl_timeout: timeout })).not.toThrow()
    }

    const invalidTimeouts = [0, -1, 61, 100]
    for (const timeout of invalidTimeouts) {
      expect(() => ContentsQuerySchema.parse({ urls: ['https://example.com'], crawl_timeout: timeout })).toThrow()
    }
  })
})

describe('ContentsQuerySchema conforms to live OpenAPI spec', () => {
  test('formats enum matches spec', async () => {
    const spec = await fetchContentsSpec()
    const specFormats = spec.components.schemas.ContentsFormats.items.enum

    const schemaFormats = ContentsQuerySchema.shape.formats.unwrap().element.options
    expect([...schemaFormats].sort()).toEqual([...specFormats].sort())
  })

  test('crawl_timeout constraints match spec', async () => {
    const spec = await fetchContentsSpec()
    const specTimeout =
      spec.paths['/v1/contents'].post.requestBody.content['application/json'].schema.properties.crawl_timeout

    expect(specTimeout.minimum).toBeDefined()
    expect(specTimeout.maximum).toBeDefined()

    const schemaTimeout = ContentsQuerySchema.shape.crawl_timeout.unwrap()
    expect(schemaTimeout.minValue).toBe(specTimeout.minimum)
    expect(schemaTimeout.maxValue).toBe(specTimeout.maximum)
  })
})
