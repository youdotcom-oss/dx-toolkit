import * as z from 'zod'

/**
 * Input schema for the you-contents tool
 * Accepts an array of URLs, optional formats array (or legacy format string), and optional crawl timeout
 */
export const ContentsQuerySchema = z.object({
  urls: z
    .array(
      z.string().refine(
        (val) => {
          try {
            new URL(val)
            return true
          } catch {
            return false
          }
        },
        { message: 'Invalid URL format' },
      ),
    )
    .min(1)
    .describe('Array of webpage URLs to extract content from (e.g., ["https://example.com"])'),
  formats: z
    .array(z.enum(['markdown', 'html', 'metadata']))
    .optional()
    .describe('Output formats: array of "markdown" (text), "html" (layout), or "metadata" (structured data)'),
  format: z.enum(['markdown', 'html']).optional().describe('(Deprecated) Output format - use formats array instead'),
  crawl_timeout: z.number().min(1).max(60).optional().describe('Optional timeout in seconds (1-60) for page crawling'),
})

export type ContentsQuery = z.infer<typeof ContentsQuerySchema>

/**
 * Schema for a single content item in the API response
 * Based on OpenAPI spec: https://you.com/specs/openapi_contents.yaml
 */
const ContentsItemSchema = z.object({
  url: z.string().describe('URL'),
  title: z.string().optional().describe('Title (optional in actual API responses)'),
  html: z.string().nullable().optional().describe('HTML content'),
  markdown: z.string().nullable().optional().describe('Markdown content'),
  metadata: z
    .object({
      site_name: z.string().nullable().optional().describe('OpenGraph site name'),
      favicon_url: z.string().describe('Favicon URL'),
    })
    .nullable()
    .optional()
    .describe('Page metadata (only when metadata format requested)'),
})

/**
 * API response schema from You.com Contents API
 * Validates the full response array
 */
export const ContentsApiResponseSchema = z.array(ContentsItemSchema)

export type ContentsApiResponse = z.infer<typeof ContentsApiResponseSchema>
