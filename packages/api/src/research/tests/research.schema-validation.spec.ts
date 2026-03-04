import { describe, expect, test } from 'bun:test'
import { ResearchEffortSchema, ResearchQuerySchema } from '../research.schemas.ts'

const OPENAPI_SPEC_URL = 'https://you.com/specs/openapi_research.yaml'

type OpenApiSpec = {
  paths: {
    '/v1/research': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  input: { maxLength: number }
                  research_effort: { enum: string[] }
                }
              }
            }
          }
        }
      }
    }
  }
}

const fetchResearchSpec = async (): Promise<OpenApiSpec> => {
  const response = await fetch(OPENAPI_SPEC_URL)
  const text = await response.text()
  return Bun.YAML.parse(text) as OpenApiSpec
}

describe('ResearchQuerySchema OpenAPI validation', () => {
  test('accepts valid query parameters', () => {
    const validQueries = [
      { input: 'What is quantum computing?' },
      { input: 'Explain machine learning', research_effort: 'lite' },
      { input: 'Latest AI developments', research_effort: 'standard' },
      { input: 'Comprehensive research on climate change', research_effort: 'deep' },
      { input: 'Exhaustive analysis of global economics', research_effort: 'exhaustive' },
    ]

    for (const validQuery of validQueries) {
      expect(() => ResearchQuerySchema.parse(validQuery)).not.toThrow()
    }
  })

  test('rejects invalid query parameters', () => {
    const invalidQueries = [
      {}, // Missing input
      { input: '' }, // Empty input
      { input: 'test', research_effort: 'invalid' }, // Invalid research_effort
      { input: 'test', research_effort: 'high' }, // Old deep-search effort level
      { input: 'test', research_effort: 'low' }, // Old deep-search effort level
      { input: 'test', research_effort: 'medium' }, // Old deep-search effort level
    ]

    for (const invalidQuery of invalidQueries) {
      expect(() => ResearchQuerySchema.parse(invalidQuery)).toThrow()
    }
  })

  test('defaults research_effort to standard when not provided', () => {
    const result = ResearchQuerySchema.parse({ input: 'test query' })
    expect(result.research_effort).toBe('standard')
  })

  test('ResearchEffortSchema accepts all valid effort levels', () => {
    const validEfforts = ['lite', 'standard', 'deep', 'exhaustive']

    for (const effort of validEfforts) {
      expect(() => ResearchEffortSchema.parse(effort)).not.toThrow()
    }

    expect(ResearchEffortSchema.options.length).toBe(4)
  })

  test('ResearchEffortSchema rejects invalid effort levels', () => {
    const invalidEfforts = ['low', 'medium', 'high', 'none', 'extreme', 'ultra', '']

    for (const effort of invalidEfforts) {
      expect(() => ResearchEffortSchema.parse(effort)).toThrow()
    }
  })

  test('accepts complex research questions', () => {
    const complexQueries = [
      {
        input: 'What are the key differences between REST and GraphQL APIs, and when should each be used?',
        research_effort: 'deep',
      },
      {
        input: 'Compare the advantages and disadvantages of microservices architecture versus monolithic architecture',
      },
      {
        input: 'What happened in AI research during 2024? Provide a comprehensive summary with key breakthroughs.',
        research_effort: 'exhaustive',
      },
    ]

    for (const query of complexQueries) {
      expect(() => ResearchQuerySchema.parse(query)).not.toThrow()
    }
  })
})

describe('ResearchQuerySchema conforms to live OpenAPI spec', () => {
  test('research_effort enum matches spec', async () => {
    const spec = await fetchResearchSpec()
    const specEfforts =
      spec.paths['/v1/research'].post.requestBody.content['application/json'].schema.properties.research_effort.enum

    const schemaEfforts = ResearchEffortSchema.options
    expect([...schemaEfforts].sort()).toEqual([...specEfforts].sort())
  })

  test('input maxLength matches spec', async () => {
    const spec = await fetchResearchSpec()
    const inputMaxLength =
      spec.paths['/v1/research'].post.requestBody.content['application/json'].schema.properties.input.maxLength

    expect(inputMaxLength).toBe(40_000)
  })
})
