import { describe, expect, test } from 'bun:test'
import { SEARCH_API_URL } from '../../shared/api.constants.ts'
import { buildSearchRequest } from '../../shared/dry-run-utils.ts'

describe('buildSearchRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  const parseBody = (request: ReturnType<typeof buildSearchRequest>) => JSON.parse(request.body ?? '{}')

  test('builds basic search request', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(SEARCH_API_URL)
    expect(request.method).toBe('POST')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['User-Agent']).toBe('test-agent')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(parseBody(request).query).toBe('AI')
  })

  test('passes query with site: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'AI site:you.com' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('AI site:you.com')
  })

  test('passes query with filetype: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'tutorial filetype:pdf' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('tutorial filetype:pdf')
  })

  test('passes query with lang: operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search lang:en' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('search lang:en')
  })

  test('passes query with +term inclusion operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'search +machine +learning' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('search +machine +learning')
  })

  test('passes query with -term exclusion operator directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: 'python -django -flask' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('python -django -flask')
  })

  test('passes query with boolean operators directly', () => {
    const request = buildSearchRequest({
      searchQuery: { query: '(Python OR JavaScript) AND tutorial -deprecated' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe('(Python OR JavaScript) AND tutorial -deprecated')
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
        livecrawl_formats: ['markdown'],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = parseBody(request)
    expect(body.query).toBe('AI')
    expect(body.count).toBe(10)
    expect(body.freshness).toBe('week')
    expect(body.offset).toBe(5)
    expect(body.country).toBe('US')
    expect(body.safesearch).toBe('moderate')
    expect(body.livecrawl).toBe('web')
    expect(body.livecrawl_formats).toEqual(['markdown'])
  })

  test('combines multiple operators in query string', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'machine learning best practices (Python OR PyTorch) -TensorFlow filetype:pdf',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(parseBody(request).query).toBe(
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

  test('includes new fields in request body', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'AI',
        language: 'EN',
        include_domains: ['you.com', 'example.com'],
        crawl_timeout: 30,
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = parseBody(request)
    expect(body.language).toBe('EN')
    expect(body.include_domains).toEqual(['you.com', 'example.com'])
    expect(body.crawl_timeout).toBe(30)
  })

  test('includes exclude_domains in request body', () => {
    const request = buildSearchRequest({
      searchQuery: {
        query: 'AI',
        exclude_domains: ['spam.com'],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    const body = parseBody(request)
    expect(body.exclude_domains).toEqual(['spam.com'])
  })

  test('rejects include_domains and exclude_domains together', () => {
    expect(() =>
      buildSearchRequest({
        searchQuery: { query: 'test', include_domains: ['you.com'], exclude_domains: ['spam.com'] },
        YDC_API_KEY,
        getUserAgent,
      }),
    ).toThrow('Cannot combine include_domains and exclude_domains')
  })
})
