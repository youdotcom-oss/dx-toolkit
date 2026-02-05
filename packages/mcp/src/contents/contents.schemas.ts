import * as z from 'zod'

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
            favicon_url: z.string().describe('Favicon URL'),
            site_name: z.string().optional().nullable().describe('Site name'),
          })
          .optional()
          .nullable()
          .describe('Page metadata'),
      }),
    )
    .describe('Extracted items'),
})

export type ContentsStructuredContent = z.infer<typeof ContentsStructuredContentSchema>
