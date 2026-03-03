import { describe, expect, test } from 'bun:test'
import { RESEARCH_API_URL } from '../../shared/api.constants.ts'
import { buildResearchRequest } from '../../shared/dry-run-utils.ts'

describe('buildResearchRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  test('builds basic research request with input only', () => {
    const request = buildResearchRequest({
      researchQuery: { input: 'What is AI?' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(RESEARCH_API_URL)
    expect(request.method).toBe('POST')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('test-agent')

    const body = JSON.parse(request.body!)
    expect(body.input).toBe('What is AI?')
    expect(body.research_effort).toBeUndefined()
  })

  test('builds request with lite research effort', () => {
    const request = buildResearchRequest({
      researchQuery: { input: 'Quick answer on JWT', research_effort: 'lite' },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.input).toBe('Quick answer on JWT')
    expect(body.research_effort).toBe('lite')
  })

  test('builds request with standard research effort', () => {
    const request = buildResearchRequest({
      researchQuery: { input: 'What is AI?', research_effort: 'standard' },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.research_effort).toBe('standard')
  })

  test('builds request with deep research effort', () => {
    const request = buildResearchRequest({
      researchQuery: {
        input: 'Comprehensive analysis of climate change impacts',
        research_effort: 'deep',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.input).toBe('Comprehensive analysis of climate change impacts')
    expect(body.research_effort).toBe('deep')
  })

  test('builds request with exhaustive research effort', () => {
    const request = buildResearchRequest({
      researchQuery: {
        input: 'Full analysis of global economics over the last century',
        research_effort: 'exhaustive',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.research_effort).toBe('exhaustive')
  })

  test('uses correct API URL', () => {
    const request = buildResearchRequest({
      researchQuery: { input: 'test' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe('https://api.you.com/v1/research')
  })

  test('includes all required headers', () => {
    const request = buildResearchRequest({
      researchQuery: { input: 'test' },
      YDC_API_KEY: 'my-api-key',
      getUserAgent: () => 'CustomAgent/1.0',
    })

    expect(request.headers['X-API-Key']).toBe('my-api-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('CustomAgent/1.0')
  })
})
