import { describe, expect, test } from 'bun:test'
import { fetchContents } from '../contents.utils.ts'

const getUserAgent = () => 'API/test (You.com;TEST)'

// NOTE: The following tests require a You.com API key with access to the Contents API
// Using example.com/example.org as test URLs since You.com blocks self-scraping
describe('fetchContents', () => {
  test(
    'returns valid response structure for single URL',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: ['https://documentation.you.com/developer-resources/mcp-server'],
          format: 'markdown',
        },
        getUserAgent,
      })

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      const firstItem = result[0]
      expect(firstItem).toBeDefined()

      // Should have markdown content
      expect(firstItem?.markdown).toBeDefined()
      expect(typeof firstItem?.markdown).toBe('string')
    },
    { retry: 2 },
  )

  test(
    'handles multiple URLs',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: [
            'https://documentation.you.com/developer-resources/mcp-server',
            'https://documentation.you.com/developer-resources/python-sdk',
          ],
          format: 'markdown',
        },
        getUserAgent,
      })

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)

      for (const item of result) {
        expect(item).toHaveProperty('url')
        expect(item.markdown).toBeDefined()
      }
    },
    { retry: 2 },
  )

  test(
    'handles html format',
    async () => {
      const result = await fetchContents({
        contentsQuery: {
          urls: ['https://documentation.you.com/developer-resources/mcp-server'],
          format: 'html',
        },
        getUserAgent,
      })

      expect(Array.isArray(result)).toBe(true)
      const firstItem = result[0]
      expect(firstItem).toBeDefined()

      expect(firstItem?.html).toBeDefined()
      expect(typeof firstItem?.html).toBe('string')
    },
    { retry: 2 },
  )
})
