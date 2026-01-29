import { z } from 'zod';

/**
 * Search operation options schema
 *
 * @remarks
 * Validates search parameters from n8n node configuration
 */
export const SearchOptionsSchema = z.object({
  count: z.number().int().min(1).max(100).optional().describe('Number of search results to return (1-100)'),
  country: z.string().optional().describe('Two-letter country code to filter results (e.g., US, GB)'),
  excludeTerms: z.string().optional().describe('Terms to exclude from search results'),
  exactTerms: z.string().optional().describe('Exact phrase to match in search results'),
  fileType: z.string().optional().describe('File type extension to filter results (e.g., pdf, doc)'),
  freshness: z.enum(['day', 'week', 'month', 'year']).optional().describe('Filter results by recency'),
  language: z.string().optional().describe('BCP 47 language code to filter results (e.g., en, es, fr)'),
  livecrawl: z.enum(['web', 'news', 'all']).optional().describe('Type of content to crawl in real-time'),
  livecrawl_formats: z.enum(['html', 'markdown']).optional().describe('Format for live-crawled content'),
  offset: z.number().int().min(0).max(9).optional().describe('Pagination offset for search results (0-9)'),
  safesearch: z.enum(['off', 'moderate', 'strict']).optional().describe('Safe search filtering level'),
  site: z
    .string()
    .optional()
    .describe('Domain to restrict search results (e.g., example.com)')
    .refine((val) => !val || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(val), {
      message: 'Must be a valid domain format (e.g., example.com)',
    }),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * Search API response schema
 *
 * @remarks
 * Validates response structure from You.com Search API
 */
export const SearchResponseSchema = z.object({
  web: z
    .array(
      z.object({
        url: z.string().url().describe('URL of the search result'),
        title: z.string().describe('Title of the search result'),
        description: z.string().describe('Description snippet of the search result'),
      }),
    )
    .optional()
    .describe('Web search results'),
  news: z
    .array(
      z.object({
        url: z.string().url().describe('URL of the news article'),
        title: z.string().describe('Title of the news article'),
        description: z.string().describe('Description snippet of the news article'),
      }),
    )
    .optional()
    .describe('News search results'),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Contents operation options schema
 *
 * @remarks
 * Validates content extraction parameters from n8n node configuration
 */
export const ContentsOptionsSchema = z.object({
  formats: z
    .array(z.enum(['markdown', 'html', 'metadata']))
    .optional()
    .describe('Output formats for extracted content'),
  crawl_timeout: z.number().int().min(1).max(60).optional().describe('Timeout in seconds for content crawling (1-60)'),
});

export type ContentsOptions = z.infer<typeof ContentsOptionsSchema>;

/**
 * Contents API response schema
 *
 * @remarks
 * Validates response structure from You.com Contents API
 */
export const ContentsResponseSchema = z.array(
  z.object({
    url: z.string().url().describe('URL of the extracted content'),
    markdown: z.string().optional().describe('Content in Markdown format'),
    html: z.string().optional().describe('Content in HTML format'),
    metadata: z.record(z.string(), z.unknown()).optional().describe('Metadata extracted from the page'),
  }),
);

export type ContentsResponse = z.infer<typeof ContentsResponseSchema>;

/**
 * Express operation options schema
 *
 * @remarks
 * Validates AI agent parameters from n8n node configuration
 */
export const ExpressOptionsSchema = z.object({
  enableWebSearch: z.boolean().optional().describe('Enable web search augmentation for AI responses'),
});

export type ExpressOptions = z.infer<typeof ExpressOptionsSchema>;

/**
 * Express API response schema
 *
 * @remarks
 * Validates response structure from You.com Express API
 */
export const ExpressResponseSchema = z.object({
  output: z
    .array(
      z.object({
        type: z.string().min(1).describe('Type of output segment (e.g., text, citations)'),
        text: z.string().optional().describe('Text content of the output segment'),
        content: z
          .array(
            z.object({
              url: z.string().url().describe('URL of the cited source'),
              title: z.string().min(1).describe('Title of the cited source'),
              snippet: z.string().describe('Snippet from the cited source'),
            }),
          )
          .optional()
          .describe('Citations and sources for the output segment'),
      }),
    )
    .min(1)
    .describe('Array of output segments from the AI agent'),
  agent: z.string().optional().describe('Agent identifier used for the response'),
});

export type ExpressResponse = z.infer<typeof ExpressResponseSchema>;
