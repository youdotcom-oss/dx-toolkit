import { describe, expect, test } from 'bun:test'
import { CONTENTS_API_URL } from '../../shared/api.constants.ts'
import { buildContentsRequest } from '../../shared/dry-run-utils.ts'

describe('buildContentsRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  test('builds basic contents request with markdown format', () => {
    const request = buildContentsRequest({
      contentsQuery: { urls: ['https://example.com'] },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(CONTENTS_API_URL)
    expect(request.method).toBe('POST')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('test-agent')

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.urls).toEqual(['https://example.com'])
    expect(body.formats).toEqual(['markdown'])
  })

  test('builds request with multiple URLs', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://a.com', 'https://b.com', 'https://c.com'],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.urls).toEqual(['https://a.com', 'https://b.com', 'https://c.com'])
  })

  test('builds request with multiple formats', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://example.com'],
        formats: ['html', 'markdown', 'metadata'],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.formats).toEqual(['html', 'markdown', 'metadata'])
  })

  test('builds request with deprecated format parameter', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://example.com'],
        format: 'html',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.formats).toEqual(['html'])
  })

  test('prefers formats array over deprecated format parameter', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://example.com'],
        formats: ['markdown', 'metadata'],
        format: 'html',
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.formats).toEqual(['markdown', 'metadata'])
  })

  test('includes crawl_timeout when provided', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://example.com'],
        crawl_timeout: 30,
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.crawl_timeout).toBe(30)
  })

  test('omits crawl_timeout when not provided', () => {
    const request = buildContentsRequest({
      contentsQuery: {
        urls: ['https://example.com'],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.crawl_timeout).toBeUndefined()
  })
})
