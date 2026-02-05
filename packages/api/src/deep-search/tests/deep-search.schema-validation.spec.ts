import { describe, expect, test } from 'bun:test'
import { DeepSearchQuerySchema, SearchEffortSchema } from '../deep-search.schemas.ts'

describe('DeepSearchQuerySchema OpenAPI validation', () => {
  test('accepts valid query parameters', () => {
    const validQueries = [
      { query: 'What is quantum computing?' },
      { query: 'Explain machine learning', search_effort: 'low' },
      { query: 'Latest AI developments', search_effort: 'medium' },
      { query: 'Comprehensive research on climate change', search_effort: 'high' },
    ]

    for (const validQuery of validQueries) {
      expect(() => DeepSearchQuerySchema.parse(validQuery)).not.toThrow()
    }
  })

  test('rejects invalid query parameters', () => {
    const invalidQueries = [
      {}, // Missing query
      { query: '' }, // Empty query
      { query: 'test', search_effort: 'invalid' }, // Invalid search_effort
      { query: 'test', search_effort: 'extreme' }, // Invalid effort level
    ]

    for (const invalidQuery of invalidQueries) {
      expect(() => DeepSearchQuerySchema.parse(invalidQuery)).toThrow()
    }
  })

  test('defaults search_effort to medium when not provided', () => {
    const result = DeepSearchQuerySchema.parse({ query: 'test query' })
    expect(result.search_effort).toBe('medium')
  })

  test('SearchEffortSchema accepts all valid effort levels', () => {
    const validEfforts = ['low', 'medium', 'high']

    for (const effort of validEfforts) {
      expect(() => SearchEffortSchema.parse(effort)).not.toThrow()
    }
  })

  test('SearchEffortSchema rejects invalid effort levels', () => {
    const invalidEfforts = ['none', 'extreme', 'ultra', 'minimal', '']

    for (const effort of invalidEfforts) {
      expect(() => SearchEffortSchema.parse(effort)).toThrow()
    }
  })

  test('accepts complex research questions', () => {
    const complexQueries = [
      {
        query: 'What are the key differences between REST and GraphQL APIs, and when should each be used?',
        search_effort: 'high',
      },
      {
        query: 'Compare the advantages and disadvantages of microservices architecture versus monolithic architecture',
      },
      {
        query: 'What happened in AI research during 2024? Provide a comprehensive summary with key breakthroughs.',
        search_effort: 'high',
      },
    ]

    for (const query of complexQueries) {
      expect(() => DeepSearchQuerySchema.parse(query)).not.toThrow()
    }
  })
})
