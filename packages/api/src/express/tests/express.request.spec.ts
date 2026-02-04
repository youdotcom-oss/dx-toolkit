import { describe, expect, test } from 'bun:test'
import { EXPRESS_API_URL } from '../../shared/api.constants.ts'
import { buildExpressRequest } from '../../shared/dry-run-utils.ts'

describe('buildExpressRequest', () => {
  const getUserAgent = () => 'test-agent'
  const YDC_API_KEY = 'test-key'

  test('builds basic express request', () => {
    const request = buildExpressRequest({
      agentInput: { input: 'What is AI?' },
      YDC_API_KEY,
      getUserAgent,
    })

    expect(request.url).toBe(EXPRESS_API_URL)
    expect(request.method).toBe('POST')
    expect(request.headers['X-API-Key']).toBe('test-key')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers.Accept).toBe('application/json')
    expect(request.headers['User-Agent']).toBe('test-agent')

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.agent).toBe('express')
    expect(body.input).toBe('What is AI?')
    expect(body.stream).toBe(false)
    expect(body.tools).toBeUndefined()
  })

  test('includes tools when provided', () => {
    const request = buildExpressRequest({
      agentInput: {
        input: 'Search for AI news',
        tools: [{ type: 'web_search' }],
      },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.tools).toEqual([{ type: 'web_search' }])
  })

  test('omits tools when not provided', () => {
    const request = buildExpressRequest({
      agentInput: { input: 'Simple question' },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.tools).toBeUndefined()
  })

  test('always sets stream to false', () => {
    const request = buildExpressRequest({
      agentInput: { input: 'test' },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.stream).toBe(false)
  })

  test('sets agent to express', () => {
    const request = buildExpressRequest({
      agentInput: { input: 'test' },
      YDC_API_KEY,
      getUserAgent,
    })

    // biome-ignore lint/style/noNonNullAssertion: Test code - body is always defined
    const body = JSON.parse(request.body!)
    expect(body.agent).toBe('express')
  })
})
