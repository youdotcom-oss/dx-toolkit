import { describe, expect, test } from 'bun:test'
import { LanguageSchema, SearchQuerySchema } from '../search.schemas.ts'

const OPENAPI_SPEC_URL = 'https://you.com/specs/openapi_search_v1.yaml'

type OpenApiSpec = {
  paths: {
    '/v1/search': {
      get: {
        parameters: Array<{
          name: string
          schema: {
            enum?: string[]
            minimum?: number
            maximum?: number
            $ref?: string
            oneOf?: Array<{ $ref?: string }>
          }
        }>
      }
    }
  }
  components: {
    schemas: {
      Country: { enum: string[] }
      Language: { enum: string[] }
      SafeSearch: { enum: string[] }
      LiveCrawl: { enum: string[] }
      LiveCrawlFormats: { enum: string[] }
    }
  }
}

const fetchSearchSpec = async (): Promise<OpenApiSpec> => {
  const response = await fetch(OPENAPI_SPEC_URL)
  const text = await response.text()
  return Bun.YAML.parse(text) as OpenApiSpec
}

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

describe('SearchQuerySchema conforms to live OpenAPI spec', () => {
  test('country enum matches spec', async () => {
    const spec = await fetchSearchSpec()
    const specCountries = spec.components.schemas.Country.enum

    const schemaCountries = SearchQuerySchema.shape.country.unwrap().options
    expect([...schemaCountries].sort()).toEqual([...specCountries].sort())
  })

  test('language enum matches spec', async () => {
    const spec = await fetchSearchSpec()
    const specLanguages = spec.components.schemas.Language.enum

    const schemaLanguages = LanguageSchema.options
    expect([...schemaLanguages].sort()).toEqual([...specLanguages].sort())
  })

  test('safesearch enum matches spec', async () => {
    const spec = await fetchSearchSpec()
    const specSafesearch = spec.components.schemas.SafeSearch.enum

    const schemaSafesearch = SearchQuerySchema.shape.safesearch.unwrap().options
    expect([...schemaSafesearch].sort()).toEqual([...specSafesearch].sort())
  })

  test('livecrawl enum matches spec', async () => {
    const spec = await fetchSearchSpec()
    const specLivecrawl = spec.components.schemas.LiveCrawl.enum

    const schemaLivecrawl = SearchQuerySchema.shape.livecrawl.unwrap().options
    expect([...schemaLivecrawl].sort()).toEqual([...specLivecrawl].sort())
  })

  test('livecrawl_formats enum matches spec', async () => {
    const spec = await fetchSearchSpec()
    const specFormats = spec.components.schemas.LiveCrawlFormats.enum

    const schemaFormats = SearchQuerySchema.shape.livecrawl_formats.unwrap().options
    expect([...schemaFormats].sort()).toEqual([...specFormats].sort())
  })

  test('count constraints match spec', async () => {
    const spec = await fetchSearchSpec()
    const countParam = spec.paths['/v1/search'].get.parameters.find((p) => p.name === 'count')

    expect(countParam?.schema.minimum).toBeDefined()
    expect(countParam?.schema.maximum).toBeDefined()

    const schemaCount = SearchQuerySchema.shape.count.unwrap()
    expect(schemaCount.minValue).toBe(countParam?.schema.minimum)
    expect(schemaCount.maxValue).toBe(countParam?.schema.maximum)
  })
})
