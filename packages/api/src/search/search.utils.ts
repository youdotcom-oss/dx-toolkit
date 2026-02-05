import { SEARCH_API_URL } from '../shared/api.constants.ts'
import type { GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type SearchQuery, SearchResponseSchema } from './search.schemas.ts'

export const fetchSearchResults = async ({
  YDC_API_KEY = process.env.YDC_API_KEY,
  searchQuery,
  getUserAgent,
}: {
  searchQuery: SearchQuery
  YDC_API_KEY?: string
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

  const options = {
    method: 'GET',
    headers: new Headers({
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
    }

    throw new Error(`Failed to perform search. Error code: ${errorCode}`)
  }

  const results = await response.json()

  // Check for error field in 200 responses (e.g., API limit errors)
  checkResponseForErrors(results)

  const parsedResults = SearchResponseSchema.parse(results)

  return parsedResults
}
