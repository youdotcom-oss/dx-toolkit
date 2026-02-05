import * as z from 'zod'

/**
 * Search effort levels for deep-search API
 * Controls computation budget and response time
 */
export const SearchEffortSchema = z.enum(['low', 'medium', 'high']).describe('Search effort level')

/**
 * Input schema for deep-search API
 * Based on OpenAPI spec: https://docs.you.com/api-reference/deep-search/v1-deep_search
 *
 * @public
 */
export const DeepSearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .describe('The research question or complex query requiring in-depth investigation and multi-step reasoning'),
  search_effort: SearchEffortSchema.optional()
    .default('medium')
    .describe('Computation budget: low (<30s), medium (<60s, default), high (<300s)'),
})

export type DeepSearchQuery = z.infer<typeof DeepSearchQuerySchema>

/**
 * Schema for a single source in the deep-search response
 *
 * @public
 */
const DeepSearchSourceSchema = z.object({
  url: z.string().describe('Source webpage URL'),
  title: z.string().describe('Source webpage title'),
  snippets: z.array(z.string()).describe('Relevant excerpts from the source page used in generating the answer'),
})

/**
 * Response schema for deep-search API
 *
 * @public
 */
export const DeepSearchResponseSchema = z.object({
  answer: z.string().describe('Comprehensive response with inline citations, formatted in Markdown'),
  results: z.array(DeepSearchSourceSchema).describe('List of web sources used to generate the answer'),
})

export type DeepSearchResponse = z.infer<typeof DeepSearchResponseSchema>
