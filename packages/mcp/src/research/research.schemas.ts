import * as z from 'zod'

// Minimal schema for structuredContent (reduces payload duplication)
// Full research content is in the text content field
export const ResearchStructuredContentSchema = z.object({
  content_type: z.string().describe('Format of the content field'),
  sourceCount: z.number().describe('Number of sources used'),
  sources: z
    .array(
      z.object({
        url: z.string().describe('Source URL'),
        title: z.string().optional().describe('Source title'),
        snippetCount: z.number().describe('Number of excerpts from this source'),
      }),
    )
    .describe('Sources used in the research answer'),
})

export type ResearchStructuredContent = z.infer<typeof ResearchStructuredContentSchema>
