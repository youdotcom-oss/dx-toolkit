import * as z from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').describe('Search query (supports +, -, site:, filetype:, lang:)'),
  count: z.number().int().min(1).max(20).optional().describe('Max results per section'),
  freshness: z.enum(['day', 'week', 'month', 'year']).optional().describe('Filter by freshness'),
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
  site: z.string().optional().describe('Specific domain'),
  fileType: z.string().optional().describe('File type'),
  language: z.string().optional().describe('ISO 639-1 language code'),
  excludeTerms: z.string().optional().describe('Terms to exclude (pipe-separated)'),
  exactTerms: z.string().optional().describe('Exact terms (pipe-separated)'),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

const WebResultSchema = z.object({
  url: z.string().describe('URL'),
  title: z.string().describe('Title'),
  description: z.string().describe('Description'),
  snippets: z.array(z.string()).describe('Content snippets'),
  page_age: z.string().optional().describe('Publication timestamp'),
  authors: z.array(z.string()).optional().describe('Authors'),
});

const NewsResultSchema = z.object({
  title: z.string().describe('Title'),
  description: z.string().describe('Description'),
  page_age: z.string().describe('Publication timestamp'),
  url: z.string().describe('URL'),
});

export type NewsResult = z.infer<typeof NewsResultSchema>;

const MetadataSchema = z.object({
  request_uuid: z.string().optional().describe('Request ID'),
  query: z.string().describe('Query'),
  latency: z.number().describe('Latency in seconds'),
});

export const SearchResponseSchema = z.object({
  results: z.object({
    web: z.array(WebResultSchema).optional(),
    news: z.array(NewsResultSchema).optional(),
  }),
  metadata: MetadataSchema.partial(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// Minimal schema for structuredContent (reduces payload duplication)
// Excludes metadata (query, request_uuid, latency) as these are not actionable by LLM
export const SearchStructuredContentSchema = z.object({
  resultCounts: z.object({
    web: z.number().describe('Web results'),
    news: z.number().describe('News results'),
    total: z.number().describe('Total results'),
  }),
  results: z
    .object({
      web: z
        .array(
          z.object({
            url: z.string().describe('URL'),
            title: z.string().describe('Title'),
          }),
        )
        .optional()
        .describe('Web results'),
      news: z
        .array(
          z.object({
            url: z.string().describe('URL'),
            title: z.string().describe('Title'),
          }),
        )
        .optional()
        .describe('News results'),
    })
    .optional()
    .describe('Search results'),
});

export type SearchStructuredContent = z.infer<typeof SearchStructuredContentSchema>;
