import * as z from 'zod'

/**
 * Language codes supported by You.com Search API (BCP 47 format)
 * Based on OpenAPI spec: https://you.com/specs/openapi_search_v1.yaml
 */
export const LanguageSchema = z.enum([
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
])

export const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .describe(
      'Search query. Supports operators: site:domain.com (domain filter), filetype:pdf (file type), +term (include), -term (exclude), AND/OR/NOT (boolean logic), lang:en (language). Example: "machine learning (Python OR PyTorch) -TensorFlow filetype:pdf"',
    ),
  count: z.number().int().min(1).max(100).optional().describe('Max results per section'),
  freshness: z.string().optional().describe('day/week/month/year or YYYY-MM-DDtoYYYY-MM-DD'),
  offset: z.number().int().min(0).max(9).optional().describe('Pagination offset'),
  country: z
    .enum([
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
    ])
    .optional()
    .describe('Country code'),
  safesearch: z.enum(['off', 'moderate', 'strict']).optional().describe('Filter level'),
  livecrawl: z.enum(['web', 'news', 'all']).optional().describe('Live-crawl sections for full content'),
  livecrawl_formats: z.enum(['html', 'markdown']).optional().describe('Format for crawled content'),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>

const WebResultSchema = z.object({
  url: z.string().describe('URL'),
  title: z.string().describe('Title'),
  description: z.string().describe('Description'),
  snippets: z.array(z.string()).describe('Content snippets'),
  page_age: z.string().optional().describe('Publication timestamp'),
  authors: z.array(z.string()).optional().describe('Authors'),
  thumbnail_url: z.string().optional().describe('Thumbnail image URL'),
  favicon_url: z.string().optional().describe('Favicon URL'),
  contents: z
    .object({
      html: z.string().optional().describe('Full HTML content'),
      markdown: z.string().optional().describe('Full Markdown content'),
    })
    .optional()
    .describe('Live-crawled page content'),
})

const NewsResultSchema = z.object({
  title: z.string().describe('Title'),
  description: z.string().describe('Description'),
  page_age: z.string().describe('Publication timestamp'),
  url: z.string().describe('URL'),
  thumbnail_url: z.string().optional().describe('Thumbnail image URL'),
  contents: z
    .object({
      html: z.string().optional().describe('Full HTML content'),
      markdown: z.string().optional().describe('Full Markdown content'),
    })
    .optional()
    .describe('Live-crawled page content'),
})

export type NewsResult = z.infer<typeof NewsResultSchema>

const MetadataSchema = z.object({
  search_uuid: z.string().optional().describe('Unique search request ID'),
  query: z.string().describe('Query'),
  latency: z.number().describe('Latency in seconds'),
})

export const SearchResponseSchema = z.object({
  results: z.object({
    web: z.array(WebResultSchema).optional(),
    news: z.array(NewsResultSchema).optional(),
  }),
  metadata: MetadataSchema.partial(),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>
