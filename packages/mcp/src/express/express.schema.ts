import * as z from 'zod'

// Minimal schema for structuredContent (reduces payload duplication)
export const ExpressStructuredContentSchema = z.object({
  answer: z.string().describe('AI answer'),
  hasResults: z.boolean().describe('Has web results'),
  resultCount: z.number().describe('Result count'),
  agent: z.string().optional().describe('Agent ID'),
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
    })
    .optional()
    .describe('Search results'),
})
