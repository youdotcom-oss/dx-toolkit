import * as z from 'zod';

/**
 * Input schema for the you-contents tool
 * Accepts an array of URLs and optional format
 */
export const ContentsQuerySchema = z.object({
  urls: z.array(z.string().url()).min(1).describe('URLs to extract content from'),
  format: z
    .enum(['markdown', 'html'])
    .optional()
    .default('markdown')
    .describe('Output format: markdown (text) or html (layout)'),
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
  format: z.string().describe('Content format'),
  items: z
    .array(
      z.object({
        url: z.string().describe('URL'),
        title: z.string().optional().describe('Title'),
        content: z.string().describe('Extracted content'),
        contentLength: z.number().describe('Content length'),
      }),
    )
    .describe('Extracted items'),
});

export type ContentsStructuredContent = z.infer<typeof ContentsStructuredContentSchema>;
