import { describe, expect, test } from 'bun:test'
import { callResearch } from '../research.utils.ts'

const getUserAgent = () => 'API/test (You.com;TEST)'

describe('callResearch', () => {
  test(
    'returns valid response structure for basic query',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'What is TypeScript?',
          research_effort: 'lite',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('output')
      expect(result.output).toHaveProperty('content')
      expect(result.output).toHaveProperty('content_type')
      expect(result.output).toHaveProperty('sources')
      expect(typeof result.output.content).toBe('string')
      expect(result.output.content_type).toBe('text')
      expect(Array.isArray(result.output.sources)).toBe(true)
      expect(result.output.content.length).toBeGreaterThan(0)
    },
    { retry: 2, timeout: 15_000 },
  )

  test(
    'handles standard research effort',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'Explain REST API principles',
          research_effort: 'standard',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('output')
      expect(typeof result.output.content).toBe('string')
      expect(Array.isArray(result.output.sources)).toBe(true)
    },
    { retry: 2, timeout: 30_000 },
  )

  test(
    'validates response schema with sources',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'What are the benefits of microservices?',
          research_effort: 'lite',
        },
        getUserAgent,
      })

      expect(result.output.sources.length).toBeGreaterThan(0)

      const source = result.output.sources[0]
      expect(source).toBeDefined()
      expect(source).toHaveProperty('url')
      expect(source).toHaveProperty('snippets')
      expect(typeof source?.url).toBe('string')
      expect(Array.isArray(source?.snippets)).toBe(true)
    },
    { retry: 2, timeout: 15_000 },
  )

  test(
    'content contains markdown with inline citations',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'What is JWT authentication?',
          research_effort: 'lite',
        },
        getUserAgent,
      })

      expect(typeof result.output.content).toBe('string')
      expect(result.output.content.length).toBeGreaterThan(0)
      expect(result.output.content).toMatch(/(?:\[\d+(?:,\s*\d+)*\]|\[\[\d+(?:,\s*\d+)*\]\])/)
    },
    { retry: 2, timeout: 15_000 },
  )

  test(
    'handles complex multi-part questions',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'What is GraphQL and how does it differ from REST?',
          research_effort: 'lite',
        },
        getUserAgent,
      })

      expect(result).toHaveProperty('output')
      expect(result.output.sources.length).toBeGreaterThan(0)
      expect(result.output.content.length).toBeGreaterThan(100)
    },
    { retry: 2, timeout: 15_000 },
  )

  test(
    'sources include relevant snippets',
    async () => {
      const result = await callResearch({
        researchQuery: {
          input: 'What is Docker containerization?',
          research_effort: 'lite',
        },
        getUserAgent,
      })

      const sourcesWithSnippets = result.output.sources.filter((source) => source.snippets.length > 0)
      expect(sourcesWithSnippets.length).toBeGreaterThan(0)

      const firstSource = sourcesWithSnippets[0]
      expect(firstSource).toBeDefined()
      expect(firstSource?.snippets[0]?.length).toBeGreaterThan(0)
    },
    { retry: 2, timeout: 15_000 },
  )
})
