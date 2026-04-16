import type * as z from 'zod'
import { RESEARCH_API_URL } from '../shared/api.constants.ts'
import type { CustomHeaders, GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type ResearchQuery, ResearchResponseSchema } from './research.schemas.ts'

/**
 * Perform research using You.com Research API
 *
 * @param params - Research query parameters
 * @returns Research response with comprehensive answer and sources
 *
 * @public
 */
export const callResearch = async ({
  researchQuery,
  YDC_API_KEY = process.env.YDC_API_KEY,
  getUserAgent,
  customHeaders,
}: {
  researchQuery: ResearchQuery
  YDC_API_KEY?: string
  getUserAgent: GetUserAgent
  customHeaders?: CustomHeaders
}) => {
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY is required for Research API')
  }

  const response = await fetch(RESEARCH_API_URL, {
    method: 'POST',
    headers: new Headers({
      ...customHeaders,
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    }),
    body: JSON.stringify(researchQuery),
  })

  if (!response.ok) {
    const errorCode = response.status

    if (errorCode === 429) {
      throw new Error('Rate limited by You.com API. Please try again later.')
    } else if (errorCode === 403) {
      throw new Error('Forbidden. Please check your You.com API key.')
    } else if (errorCode === 402) {
      throw new Error('Free tier limit exceeded. Please upgrade at: https://you.com/platform')
    }

    throw new Error(`Research API request failed. Error code: ${errorCode}`)
  }

  const data = await response.json()

  // Check for error field in 200 responses
  checkResponseForErrors(data)

  return ResearchResponseSchema.parse(data)
}

/**
 * Format research response for display
 * Returns markdown-formatted text with answer and sources
 *
 * @param response - Research API response
 * @returns Formatted markdown string
 *
 * @public
 */
export const formatResearchResponse = (response: z.infer<typeof ResearchResponseSchema>): string => {
  const parts: string[] = []

  parts.push('# Answer\n')
  parts.push(response.output.content)
  parts.push('\n')

  if (response.output.sources.length > 0) {
    parts.push('\n## Sources\n')

    for (const [index, source] of response.output.sources.entries()) {
      parts.push(`\n### ${index + 1}. ${source.title ?? source.url}\n`)
      parts.push(`**URL:** ${source.url}\n`)

      if (source.snippets?.length) {
        parts.push('\n**Key Excerpts:**\n')
        for (const snippet of source.snippets) {
          parts.push(`> ${snippet}\n`)
        }
      }
    }
  }

  return parts.join('\n')
}
