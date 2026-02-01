import * as z from 'zod'

// Minimal schema for structuredContent (reduces payload duplication)
// Excludes metadata (query, search_uuid, latency) as these are not actionable by LLM
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
            page_age: z.string().optional().describe('Publication timestamp'),
          }),
        )
        .optional()
        .describe('Web results'),
      news: z
        .array(
          z.object({
            url: z.string().describe('URL'),
            title: z.string().describe('Title'),
            page_age: z.string().describe('Publication timestamp'),
          }),
        )
        .optional()
        .describe('News results'),
    })
    .optional()
    .describe('Search results'),
})

export type SearchStructuredContent = z.infer<typeof SearchStructuredContentSchema>
