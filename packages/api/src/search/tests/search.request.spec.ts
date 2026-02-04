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

  test('builds query with site: operator', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI', site: 'you.com' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('AI site:you.com')
  })

  test('builds query with filetype: operator', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'tutorial', fileType: 'pdf' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('tutorial filetype:pdf')
  })

  test('builds query with lang: operator', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search', language: 'EN' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('search lang:EN')
  })

  test('builds query with exactTerms', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search', exactTerms: 'machine|learning' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('search +machine AND +learning')
  })

  test('builds query with excludeTerms', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'python', excludeTerms: 'django|flask' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('python -django AND -flask')
  })

  test('throws error when both exactTerms and excludeTerms are provided', () => {
    expect(() =>
      buildSearchRequest({
        searchQuery: {
          query: 'test',
          exactTerms: 'include',
          excludeTerms: 'exclude',
        },
        YDC_API_KEY,
        getUserAgent,
      }),
    ).toThrow('Cannot specify both exactTerms and excludeTerms')
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

    expect(request.queryParams?.count).toBe('10')
    expect(request.queryParams?.freshness).toBe('week')
    expect(request.queryParams?.offset).toBe('5')
    expect(request.queryParams?.country).toBe('US')
    expect(request.queryParams?.safesearch).toBe('moderate')
    expect(request.queryParams?.livecrawl).toBe('web')
    expect(request.queryParams?.livecrawl_formats).toBe('markdown')
  })

  test('combines multiple operators', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'AI',
        site: 'you.com',
        fileType: 'pdf',
        language: 'EN',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.queryParams?.query).toBe('AI site:you.com filetype:pdf lang:EN')
  })
})
