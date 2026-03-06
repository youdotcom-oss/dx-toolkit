import { SEARCH_API_URL } from '../shared/api.constants.ts'
import type { ExtraHeaders, GetUserAgent } from '../shared/api.types.ts'
import { ApiErrorResponseSchema } from '../shared/api-error.schemas.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type SearchQuery, SearchResponseSchema } from './search.schemas.ts'

export const fetchSearchResults = async ({
  YDC_API_KEY = process.env.YDC_API_KEY,
  searchQuery,
  getUserAgent,
  extraHeaders,
}: {
  searchQuery: SearchQuery
  YDC_API_KEY?: string
  getUserAgent: GetUserAgent
  extraHeaders?: ExtraHeaders
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

  const options = {
    method: 'GET',
    headers: new Headers({
      ...extraHeaders,
      'X-API-Key': YDC_API_KEY || '',
      'User-Agent': getUserAgent(),
    }),
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
      const json = await response.json()
      const errorBody = ApiErrorResponseSchema.parse(json)
      if (errorBody.message) {
        errorMessage = errorBody.message
      }
      if (errorBody.upgrade_url) {
        upgradeUrl = errorBody.upgrade_url
      }
      if (errorBody.reset_at) {
        const resetDate = new Date(errorBody.reset_at).toLocaleDateString()
        errorMessage += ` Limit resets on ${resetDate}.`
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
