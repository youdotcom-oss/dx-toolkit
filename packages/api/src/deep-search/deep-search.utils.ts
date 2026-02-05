import type * as z from 'zod'
import { DEEP_SEARCH_API_URL } from '../shared/api.constants.ts'
import type { GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type DeepSearchQuery, DeepSearchResponseSchema } from './deep-search.schemas.ts'

/**
 * Perform deep research using You.com Deep Search API
 *
 * @param params - Deep search query parameters
 * @returns Deep search response with comprehensive answer and sources
 *
 * @public
 */
export const callDeepSearch = async ({
  deepSearchQuery,
  YDC_API_KEY,
  getUserAgent,
}: {
  deepSearchQuery: DeepSearchQuery
  YDC_API_KEY: string
  getUserAgent: GetUserAgent
}) => {
  const response = await fetch(DEEP_SEARCH_API_URL, {
    method: 'POST',
    headers: new Headers({
      'X-API-Key': YDC_API_KEY || '',
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    }),
    body: JSON.stringify(deepSearchQuery),
  })

  await checkResponseForErrors(response)
  const data = await response.json()

  return DeepSearchResponseSchema.parse(data)
}

/**
 * Format deep-search response for display
 * Returns markdown-formatted text with answer and sources
 *
 * @param response - Deep search API response
 * @returns Formatted markdown string
 *
 * @public
 */
export const formatDeepSearchResponse = (response: z.infer<typeof DeepSearchResponseSchema>): string => {
  const parts: string[] = []

  // Add the comprehensive answer
  parts.push('# Answer\n')
  parts.push(response.answer)
  parts.push('\n')

  // Add sources section
  if (response.results && response.results.length > 0) {
    parts.push('\n## Sources\n')

    for (const [index, source] of response.results.entries()) {
      parts.push(`\n### ${index + 1}. ${source.title}\n`)
      parts.push(`**URL:** ${source.url}\n`)

      if (source.snippets && source.snippets.length > 0) {
        parts.push('\n**Key Excerpts:**\n')
        for (const snippet of source.snippets) {
          parts.push(`> ${snippet}\n`)
        }
      }
    }
  }

  return parts.join('\n')
}
