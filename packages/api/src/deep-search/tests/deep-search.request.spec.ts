import { describe, expect, test } from 'bun:test'
import { DEEP_SEARCH_API_URL } from '../../shared/api.constants.ts'
import { buildDeepSearchRequest } from '../../shared/dry-run-utils.ts'

describe('buildDeepSearchRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  test('builds basic deep-search request with query only', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: { query: 'What is AI?' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(DEEP_SEARCH_API_URL)
    expect(request.method).toBe('POST')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('test-agent')

    const body = JSON.parse(request.body!)
    expect(body.query).toBe('What is AI?')
    // search_effort not in body when not provided (default applied by schema validation, not dry-run)
    expect(body.search_effort).toBeUndefined()
  })

  test('builds request with explicit medium search effort', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: { query: 'What is AI?', search_effort: 'medium' },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.query).toBe('What is AI?')
    expect(body.search_effort).toBe('medium')
  })

  test('builds request with low search effort', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: {
        query: 'Quick explanation of JWT',
        search_effort: 'low',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.query).toBe('Quick explanation of JWT')
    expect(body.search_effort).toBe('low')
  })

  test('builds request with high search effort', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: {
        query: 'Comprehensive analysis of climate change impacts',
        search_effort: 'high',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.query).toBe('Comprehensive analysis of climate change impacts')
    expect(body.search_effort).toBe('high')
  })

  test('builds request with complex research question', () => {
    const complexQuery = `What are the key differences between microservices and monolithic architecture?
Include pros and cons of each approach, best use cases, and migration strategies.`

    const request = buildDeepSearchRequest({
      deepSearchQuery: {
        query: complexQuery,
        search_effort: 'high',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = JSON.parse(request.body!)
    expect(body.query).toBe(complexQuery)
    expect(body.search_effort).toBe('high')
  })

  test('uses correct API URL', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: { query: 'test' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe('https://api.you.com/v1/deep_search')
  })

  test('includes all required headers', () => {
    const request = buildDeepSearchRequest({
      deepSearchQuery: { query: 'test' },
      YDC_API_KEY: 'my-api-key',
      getUserAgent: () => 'CustomAgent/1.0',
    })

    expect(request.headers['X-API-Key']).toBe('my-api-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('CustomAgent/1.0')
  })
})
