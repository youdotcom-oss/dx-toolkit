import { describe, expect, test } from 'bun:test'
import { callDeepSearch } from '../deep-search.utils.ts'

const getUserAgent = () => 'API/test (You.com;TEST)'

describe('callDeepSearch', () => {
  test(
    'returns valid response structure for basic query',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'What is TypeScript?',
          search_effort: 'low',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('answer')
      expect(result).toHaveProperty('results')
      expect(typeof result.answer).toBe('string')
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.answer.length).toBeGreaterThan(0)
    },
    { retry: 2 },
  )

  test(
    'handles medium search effort',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'Explain REST API principles',
          search_effort: 'medium',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('answer')
      expect(result).toHaveProperty('results')
      expect(typeof result.answer).toBe('string')
      expect(Array.isArray(result.results)).toBe(true)
    },
    { retry: 2 },
  )

  test(
    'validates response schema with sources',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'What are the benefits of microservices?',
          search_effort: 'low',
        },
        getUserAgent,
      })

      // Test that results have required properties
      expect(result.results.length).toBeGreaterThan(0)

      const source = result.results[0]
      expect(source).toBeDefined()
      expect(source).toHaveProperty('url')
      expect(source).toHaveProperty('title')
      expect(source).toHaveProperty('snippets')
      expect(typeof source?.url).toBe('string')
      expect(typeof source?.title).toBe('string')
      expect(Array.isArray(source?.snippets)).toBe(true)
    },
    { retry: 2 },
  )

  test(
    'answer contains markdown with inline citations',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'What is JWT authentication?',
          search_effort: 'low',
        },
        getUserAgent,
      })

      // Answer should be non-empty markdown string
      expect(typeof result.answer).toBe('string')
      expect(result.answer.length).toBeGreaterThan(0)

      // Answer typically contains citations in the format [1], [2], etc.
      // This is a soft check - citations may or may not be present
      if (result.answer.includes('[')) {
        expect(result.answer).toMatch(/\[\d+\]/)
      }
    },
    { retry: 2 },
  )

  test(
    'handles complex multi-part questions',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'What is GraphQL and how does it differ from REST?',
          search_effort: 'low',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('answer')
      expect(result).toHaveProperty('results')
      expect(result.results.length).toBeGreaterThan(0)

      // Complex questions should have substantial answers
      expect(result.answer.length).toBeGreaterThan(100)
    },
    { retry: 2 },
  )

  test(
    'sources include relevant snippets',
    async () => {
      const result = await callDeepSearch({
        deepSearchQuery: {
          query: 'What is Docker containerization?',
          search_effort: 'low',
        },
        getUserAgent,
      })

      // Check that at least one source has snippets
      const sourcesWithSnippets = result.results.filter((source) => source.snippets.length > 0)
      expect(sourcesWithSnippets.length).toBeGreaterThan(0)

      // Snippets should be non-empty strings
      const firstSource = sourcesWithSnippets[0]
      expect(firstSource).toBeDefined()
      expect(firstSource?.snippets[0]?.length).toBeGreaterThan(0)
    },
    { retry: 2 },
  )
})
