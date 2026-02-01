import { describe, expect, setDefaultTimeout, test } from 'bun:test'
import { callExpressAgent } from '../express.utils.ts'

const getUserAgent = () => 'API/test (You.com;TEST)'

setDefaultTimeout(20_000)

describe('callExpressAgent', () => {
  test(
    'returns answer only (WITHOUT web_search tools)',
    async () => {
      const result = await callExpressAgent({
        agentInput: { input: 'What is machine learning?' },
        getUserAgent,
      })

      // Verify MCP response structure
      expect(result).toHaveProperty('answer')
      expect(typeof result.answer).toBe('string')
      expect(result.answer.length).toBeGreaterThan(0)

      // Should NOT have results when web_search is not used
      expect(result.results).toBeUndefined()

      expect(result.agent).toBe('express')
    },
    { retry: 2 },
  )

  test(
    'returns answer and search results (WITH web_search tools)',
    async () => {
      const result = await callExpressAgent({
        agentInput: {
          input: 'Latest developments in quantum computing',
          tools: [{ type: 'web_search' }],
        },
        getUserAgent,
      })

      // Verify MCP response has both answer and results
      expect(result).toHaveProperty('answer')
      expect(typeof result.answer).toBe('string')
      expect(result.answer.length).toBeGreaterThan(0)

      expect(result).toHaveProperty('results')
      expect(result.results).toHaveProperty('web')
      expect(Array.isArray(result.results?.web)).toBe(true)
      expect(result.results?.web.length).toBeGreaterThan(0)

      // Verify each search result has required fields
      const firstResult = result.results?.web[0]
      expect(firstResult).toHaveProperty('url')
      expect(firstResult).toHaveProperty('title')
      expect(firstResult).toHaveProperty('snippet')
      expect(typeof firstResult?.url).toBe('string')
      expect(typeof firstResult?.title).toBe('string')
      expect(typeof firstResult?.snippet).toBe('string')
      expect(firstResult?.url.length).toBeGreaterThan(0)
      expect(firstResult?.title.length).toBeGreaterThan(0)

      expect(result.agent).toBe('express')
    },
    { timeout: 30_000, retry: 2 },
  )

  test(
    'works without optional parameters',
    async () => {
      const result = await callExpressAgent({
        agentInput: { input: 'What is the capital of France?' },
        getUserAgent,
        // No progressToken or sendProgress provided
      })

      // Should work normally without progress tracking
      expect(result).toHaveProperty('answer')
      expect(result.answer.length).toBeGreaterThan(0)
      expect(result.agent).toBe('express')
    },
    { retry: 2 },
  )
})
