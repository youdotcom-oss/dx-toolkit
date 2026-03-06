import { describe, expect, test } from 'bun:test'
import { SEARCH_API_URL } from '../../shared/api.constants.ts'
import { buildSearchRequest } from '../../shared/dry-run-utils.ts'

describe('buildSearchRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  test('builds basic search request', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(SEARCH_API_URL)
    expect(request.method).toBe('GET')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['User-Agent']).toBe('test-agent')
    expect(request.queryParams?.query).toBe('AI')
  })

  test('passes query with site: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI site:you.com' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('AI site:you.com')
  })

  test('passes query with filetype: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'tutorial filetype:pdf' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('tutorial filetype:pdf')
  })

  test('passes query with lang: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search lang:en' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('search lang:en')
  })

  test('passes query with +term inclusion operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search +machine +learning' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('search +machine +learning')
  })

  test('passes query with -term exclusion operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'python -django -flask' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('python -django -flask')
  })

  test('passes query with boolean operators directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: '(Python OR JavaScript) AND tutorial -deprecated' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('(Python OR JavaScript) AND tutorial -deprecated')
  })

  test('includes advanced search parameters', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'AI',
        count: 10,
        freshness: 'week',
        offset: 5,
        country: 'US',
        safesearch: 'moderate',
        livecrawl: 'web',
        livecrawl_formats: 'markdown',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('AI')
    expect(request.queryParams?.count).toBe('10')
    expect(request.queryParams?.freshness).toBe('week')
    expect(request.queryParams?.offset).toBe('5')
    expect(request.queryParams?.country).toBe('US')
    expect(request.queryParams?.safesearch).toBe('moderate')
    expect(request.queryParams?.livecrawl).toBe('web')
    expect(request.queryParams?.livecrawl_formats).toBe('markdown')
  })

  test('combines multiple operators in query string', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'machine learning best practices (Python OR PyTorch) -TensorFlow filetype:pdf',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe(
      'machine learning best practices (Python OR PyTorch) -TensorFlow filetype:pdf',
    )
  })

  test('forwards customHeaders into request headers', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI' },
      YDC_API_KEY,
      getUserAgent,
      customHeaders: { 'X-OAuth-User-Id': 'user-123' },
    })

    expect(request.headers['X-OAuth-User-Id']).toBe('user-123')
  })

  test('standard headers cannot be overridden by customHeaders', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI' },
      YDC_API_KEY,
      getUserAgent,
      customHeaders: { 'X-API-Key': 'attacker-key', 'User-Agent': 'evil' },
    })

    expect(request.headers['X-API-Key']).toBe(YDC_API_KEY)
    expect(request.headers['User-Agent']).toBe('test-agent')
  })
})
