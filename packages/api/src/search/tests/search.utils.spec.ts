import { describe, expect, test } from 'bun:test'
import { fetchSearchResults } from '../search.utils.ts'

const getUserAgent = () => 'API/test (You.com;TEST)'

describe('fetchSearchResults', () => {
  test(
    'returns valid response structure for basic query',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: { query: 'latest stock news' },
        getUserAgent,
      })

      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('metadata')
      expect(result.results).toHaveProperty('web')
      expect(Array.isArray(result.results.web)).toBe(true)

      // Assert required metadata fields
      expect(typeof result.metadata?.query).toBe('string')

      // search_uuid is optional but should be string if present
      expect(result.metadata?.search_uuid).toBeDefined()
      expect(typeof result.metadata?.search_uuid).toBe('string')
    },
    { retry: 2 },
  )

  test(
    'handles search with filters',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: {
          query: 'javascript tutorial',
          count: 3,
          freshness: 'week',
          country: 'US',
        },
        getUserAgent,
      })

      expect(result.results.web?.length).toBeLessThanOrEqual(3)
      expect(result.metadata?.query).toContain('javascript tutorial')
    },
    { retry: 2 },
  )

  test(
    'validates response schema',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: { query: 'latest technology news' },
        getUserAgent,
      })

      // Test that web results have required properties
      const webResult = result.results.web![0]

      expect(webResult).toHaveProperty('url')
      expect(webResult).toHaveProperty('title')
      expect(webResult).toHaveProperty('description')
      expect(webResult).toHaveProperty('snippets')
      expect(Array.isArray(webResult?.snippets)).toBe(true)
    },
    { retry: 2 },
  )

  test(
    'handles livecrawl parameters',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: {
          query: 'python tutorial',
          count: 2,
          livecrawl: 'web',
          livecrawl_formats: ['markdown'],
        },
        getUserAgent,
      })

      expect(result.results.web?.length).toBeLessThanOrEqual(2)
      // Livecrawl should return contents field (fails naturally if not present)
      expect(result.results.web?.[0]).toHaveProperty('contents')
      expect(result.results.web?.[0]?.contents).toHaveProperty('markdown')
      expect(typeof result.results.web?.[0]?.contents?.markdown).toBe('string')
    },
    { retry: 2 },
  )

  test(
    'handles freshness date ranges',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: {
          query: 'AI news',
          freshness: '2024-01-01to2024-12-31',
          count: 3,
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('results')
      expect(result.metadata?.query).toContain('AI news')
    },
    { retry: 2 },
  )

  test(
    'handles count greater than 20',
    async () => {
      const result = await fetchSearchResults({
        searchQuery: {
          query: 'machine learning',
          count: 50,
        },
        getUserAgent,
      })

      expect(result.results.web?.length).toBeGreaterThan(0)
      expect(result.results.web?.length).toBeLessThanOrEqual(50)
    },
    { retry: 2 },
  )

  test('rejects include_domains and exclude_domains together', async () => {
    await expect(
      fetchSearchResults({
        searchQuery: { query: 'test', include_domains: ['you.com'], exclude_domains: ['spam.com'] },
        getUserAgent,
      }),
    ).rejects.toThrow('Cannot combine include_domains and exclude_domains')
  })
})
