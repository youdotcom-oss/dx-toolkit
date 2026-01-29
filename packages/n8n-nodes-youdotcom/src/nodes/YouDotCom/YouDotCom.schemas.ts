import { z } from 'zod';

/**
 * Search operation options schema
 *
 * @remarks
 * Validates search parameters from n8n node configuration
 */
export const SearchOptionsSchema = z.object({
  count: z.number().int().min(1).max(100).optional(),
  country: z.string().optional(),
  excludeTerms: z.string().optional(),
  exactTerms: z.string().optional(),
  fileType: z.string().optional(),
  freshness: z.string().optional(),
  language: z.string().optional(),
  livecrawl: z.string().optional(),
  livecrawl_formats: z.string().optional(),
  offset: z.number().int().min(0).max(9).optional(),
  safesearch: z.string().optional(),
  site: z.string().optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * Contents operation options schema
 *
 * @remarks
 * Validates content extraction parameters from n8n node configuration
 */
export const ContentsOptionsSchema = z.object({
  formats: z.array(z.enum(['markdown', 'html', 'metadata'])).optional(),
  crawl_timeout: z.number().int().min(1).max(60).optional(),
});

export type ContentsOptions = z.infer<typeof ContentsOptionsSchema>;

/**
 * Express operation options schema
 *
 * @remarks
 * Validates AI agent parameters from n8n node configuration
 */
export const ExpressOptionsSchema = z.object({
  enableWebSearch: z.boolean().optional(),
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
        type: z.string(),
        text: z.string().optional(),
        content: z
          .array(
            z.object({
              url: z.string(),
              title: z.string(),
              snippet: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  agent: z.string().optional(),
});

export type ExpressResponse = z.infer<typeof ExpressResponseSchema>;
