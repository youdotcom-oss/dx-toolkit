import * as z from 'zod'

/**
 * Research effort levels for Research API
 * Controls how much time and depth the API spends on the question
 * Based on OpenAPI spec: https://docs.you.com/api-reference/research/v1-research
 *
 * @public
 */
export const ResearchEffortSchema = z
  .enum(['lite', 'standard', 'deep', 'exhaustive'])
  .describe(
    'Controls how much time and effort the Research API spends on your question. Higher effort levels run more searches and dig deeper into sources, at the cost of a longer response time.',
  )

/**
 * Input schema for Research API
 * Based on OpenAPI spec: https://docs.you.com/api-reference/research/v1-research
 *
 * @public
 */
export const ResearchQuerySchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .describe(
      'The research question or complex query requiring in-depth investigation and multi-step reasoning. Maximum length: 40,000 characters.',
    ),
  research_effort: ResearchEffortSchema.optional()
    .default('standard')
    .describe(
      'Controls how much time and effort the Research API spends on your question. lite: fast answers, standard: balanced (default), deep: thorough, exhaustive: most comprehensive.',
    ),
})

export type ResearchQuery = z.infer<typeof ResearchQuerySchema>

/**
 * Schema for a single source in the research response
 *
 * @public
 */
const ResearchSourceSchema = z.object({
  url: z.string().describe('Source webpage URL'),
  title: z.string().optional().describe('Source webpage title'),
  snippets: z.array(z.string()).describe('Relevant excerpts from the source page used in generating the answer'),
})

/**
 * Schema for the research output object
 *
 * @public
 */
const ResearchOutputSchema = z.object({
  content: z.string().describe('Comprehensive response with inline citations, formatted in Markdown'),
  content_type: z.enum(['text']).describe('The format of the content field'),
  sources: z.array(ResearchSourceSchema).describe('List of web sources used to generate the answer'),
})

/**
 * Response schema for Research API
 *
 * @public
 */
export const ResearchResponseSchema = z.object({
  output: ResearchOutputSchema.describe('The research output containing the answer and sources'),
})

export type ResearchResponse = z.infer<typeof ResearchResponseSchema>
