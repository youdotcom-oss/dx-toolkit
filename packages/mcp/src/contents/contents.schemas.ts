import * as z from 'zod';

/**
 * Input schema for the you-contents tool
 * Accepts an array of URLs, optional formats array (or legacy format string), and optional crawl timeout
 */
export const ContentsQuerySchema = z.object({
  urls: z
    .array(z.string().url())
    .min(1)
    .describe('Array of webpage URLs to extract content from (e.g., ["https://example.com"])'),
  formats: z
    .array(z.enum(['markdown', 'html', 'metadata']))
    .optional()
    .describe('Output formats: array of "markdown" (text), "html" (layout), or "metadata" (structured data)'),
  format: z.enum(['markdown', 'html']).optional().describe('(Deprecated) Output format - use formats array instead'),
  crawl_timeout: z.number().min(1).max(60).optional().describe('Optional timeout in seconds (1-60) for page crawling'),
});

export type ContentsQuery = z.infer<typeof ContentsQuerySchema>;

/**
 * Schema for a single content item in the API response
 */
const ContentsItemSchema = z.object({
  url: z.string().describe('URL'),
  title: z.string().optional().describe('Title'),
  html: z.string().optional().describe('HTML content'),
  markdown: z.string().optional().describe('Markdown content'),
  metadata: z
    .object({
      jsonld: z.array(z.record(z.string(), z.any())).optional().describe('JSON-LD structured data (Schema.org)'),
      opengraph: z.record(z.string(), z.string()).optional().describe('OpenGraph meta tags'),
      twitter: z.record(z.string(), z.string()).optional().describe('Twitter Card metadata'),
    })
    .optional()
    .describe('Structured metadata when available'),
});

/**
 * API response schema from You.com Contents API
 * Validates the full response array
 */
export const ContentsApiResponseSchema = z.array(ContentsItemSchema);

export type ContentsApiResponse = z.infer<typeof ContentsApiResponseSchema>;

/**
 * Structured content schema for MCP response
 * Includes full content and metadata for each URL
 */
export const ContentsStructuredContentSchema = z.object({
  count: z.number().describe('URLs processed'),
  formats: z.array(z.string()).describe('Content formats requested'),
  items: z
    .array(
      z.object({
        url: z.string().describe('URL'),
        title: z.string().optional().describe('Title'),
        markdown: z.string().optional().describe('Markdown content'),
        html: z.string().optional().describe('HTML content'),
        metadata: z
          .object({
            jsonld: z.array(z.record(z.string(), z.any())).optional(),
            opengraph: z.record(z.string(), z.string()).optional(),
            twitter: z.record(z.string(), z.string()).optional(),
          })
          .optional()
          .describe('Structured metadata'),
      }),
    )
    .describe('Extracted items'),
});

export type ContentsStructuredContent = z.infer<typeof ContentsStructuredContentSchema>;
