import { describe, expect, test } from 'bun:test'
import { LanguageSchema, SearchQuerySchema } from '../search.schemas.ts'

describe('SearchQuerySchema OpenAPI validation', () => {
  test('accepts valid query parameters', () => {
    const validQueries = [
      { query: 'AI' },
      { query: 'test', count: 10, freshness: 'week' },
      { query: 'search', country: 'US', safesearch: 'moderate' },
      { query: 'livecrawl test', livecrawl: 'web', livecrawl_formats: 'markdown' },
    ]

    for (const validQuery of validQueries) {
      expect(() => SearchQuerySchema.parse(validQuery)).not.toThrow()
    }
  })

  test('rejects invalid query parameters', () => {
    const invalidQueries = [
      {}, // Missing query
      { query: '' }, // Empty query
      { query: 'test', count: 0 }, // Count too low
      { query: 'test', count: 101 }, // Count too high
      { query: 'test', offset: -1 }, // Negative offset
      { query: 'test', offset: 10 }, // Offset too high
      { query: 'test', safesearch: 'invalid' }, // Invalid safesearch
      { query: 'test', livecrawl: 'invalid' }, // Invalid livecrawl
    ]

    for (const invalidQuery of invalidQueries) {
      expect(() => SearchQuerySchema.parse(invalidQuery)).toThrow()
    }
  })

  test('LanguageSchema includes all 51 BCP 47 codes', () => {
    // Test a sample of language codes from the OpenAPI spec
    const languageCodes = [
      'AR',
      'EU',
      'BN',
      'BG',
      'CA',
      'ZH-HANS',
      'ZH-HANT',
      'HR',
      'CS',
      'DA',
      'NL',
      'EN',
      'EN-GB',
      'ET',
      'FI',
      'FR',
      'GL',
      'DE',
      'EL',
      'GU',
      'HE',
      'HI',
      'HU',
      'IS',
      'IT',
      'JP',
      'KN',
      'KO',
      'LV',
      'LT',
      'MS',
      'ML',
      'MR',
      'NB',
      'PL',
      'PT-BR',
      'PT-PT',
      'PA',
      'RO',
      'RU',
      'SR',
      'SK',
      'SL',
      'ES',
      'SV',
      'TA',
      'TE',
      'TH',
      'TR',
      'UK',
      'VI',
    ]

    for (const code of languageCodes) {
      expect(() => LanguageSchema.parse(code)).not.toThrow()
    }

    // Test that the schema has exactly 51 values
    expect(LanguageSchema.options.length).toBe(51)
  })

  test('rejects invalid language codes', () => {
    const invalidCodes = ['XX', 'INVALID', 'en', 'zh', '123']

    for (const code of invalidCodes) {
      expect(() => LanguageSchema.parse(code)).toThrow()
    }
  })

  test('accepts all country codes from OpenAPI spec', () => {
    const countryCodes = [
      'AR',
      'AU',
      'AT',
      'BE',
      'BR',
      'CA',
      'CL',
      'DK',
      'FI',
      'FR',
      'DE',
      'HK',
      'IN',
      'ID',
      'IT',
      'JP',
      'KR',
      'MY',
      'MX',
      'NL',
      'NZ',
      'NO',
      'CN',
      'PL',
      'PT',
      'PT-BR',
      'PH',
      'RU',
      'SA',
      'ZA',
      'ES',
      'SE',
      'CH',
      'TW',
      'TR',
      'GB',
      'US',
    ]

    for (const code of countryCodes) {
      expect(() => SearchQuerySchema.parse({ query: 'test', country: code })).not.toThrow()
    }
  })
})
