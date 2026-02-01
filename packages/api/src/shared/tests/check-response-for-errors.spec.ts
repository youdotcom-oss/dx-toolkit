import { describe, expect, test } from 'bun:test'
import { checkResponseForErrors } from '../check-response-for-errors.ts'

describe('checkResponseForErrors', () => {
  test('returns response data when no error field present', () => {
    const responseData = { results: { web: [] }, metadata: {} }
    const result = checkResponseForErrors(responseData)
    expect(result).toEqual(responseData)
  })

  test('throws when error field is a string', () => {
    const responseData = { error: 'API limit exceeded' }
    expect(() => checkResponseForErrors(responseData)).toThrow('You.com API Error: API limit exceeded')
  })

  test('throws when error field is an object', () => {
    const responseData = { error: { message: 'Invalid request', code: 400 } }
    expect(() => checkResponseForErrors(responseData)).toThrow('You.com API Error:')
  })

  test('returns primitive values unchanged', () => {
    expect(checkResponseForErrors('test')).toBe('test')
    expect(checkResponseForErrors(123)).toBe(123)
    expect(checkResponseForErrors(null)).toBe(null)
  })

  test('returns arrays unchanged', () => {
    const arr = [1, 2, 3]
    expect(checkResponseForErrors(arr)).toEqual(arr)
  })
})
