import { SEARCH_API_URL } from '../shared/api.constants.ts'
import type { GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type SearchQuery, SearchResponseSchema } from './search.schemas.ts'

/**
 * Fetches search results from You.com API
 *
 * @remarks
 * Supports both authenticated (with API key) and unauthenticated (free tier) requests.
 * Free tier requests are rate limited.
 *
 * @param searchQuery - Search parameters (query, count, etc.)
 * @param YDC_API_KEY - API key for authenticated requests (optional)
 * @param clientIP - Client IP address for rate limiting (optional)
 * @param getUserAgent - Function to get User-Agent string
 * @returns Parsed search results
 *
 * @throws Error on API failures, rate limits (429), auth failures (403), or free tier limits (402)
 *
 * @public
 */
export const fetchSearchResults = async ({
  YDC_API_KEY = process.env.YDC_API_KEY,
  searchQuery,
  clientIP,
  getUserAgent,
}: {
  searchQuery: SearchQuery
  YDC_API_KEY?: string
  clientIP?: string
  getUserAgent: GetUserAgent
}) => {
  const url = new URL(SEARCH_API_URL)

  const searchParams = new URLSearchParams()

  // Append all query parameters
  for (const [name, value] of Object.entries(searchQuery)) {
    if (value !== undefined && value !== null) {
      searchParams.append(name, `${value}`)
    }
  }

  url.search = searchParams.toString()

  const headers = new Headers({
    'User-Agent': getUserAgent(),
  })

  if (YDC_API_KEY) {
    headers.set('X-API-Key', YDC_API_KEY)
  }

  if (clientIP) {
    headers.set('X-Client-IP', clientIP)
  }

  const options = {
    method: 'GET',
    headers,
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const errorCode = response.status

    if (errorCode === 429) {
      throw new Error('Rate limited by You.com API. Please try again later.')
    } else if (errorCode === 403) {
      throw new Error('Forbidden. Please check your You.com API key.')
    } else if (errorCode === 402) {
      let errorMessage = 'Free tier limit exceeded. Please upgrade to continue.'
      let upgradeUrl = 'https://you.com/platform'

      try {
        const errorBody = (await response.json()) as any
        if (errorBody?.message) {
          errorMessage = errorBody.message
        }
        if (errorBody?.upgrade_url) {
          upgradeUrl = errorBody.upgrade_url
        }
        if (errorBody?.reset_at) {
          const resetDate = new Date(errorBody.reset_at).toLocaleDateString()
          errorMessage += ` Limit resets on ${resetDate}.`
        }
      } catch {
        // If parsing fails, use default message
      }

      throw new Error(`${errorMessage} Upgrade at: ${upgradeUrl}`)
    }

    throw new Error(`Failed to perform search. Error code: ${errorCode}`)
  }

  const results = await response.json()

  // Check for error field in 200 responses (e.g., API limit errors)
  checkResponseForErrors(results)

  const parsedResults = SearchResponseSchema.parse(results)

  return parsedResults
}
