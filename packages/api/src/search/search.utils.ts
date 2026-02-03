import { SEARCH_API_URL } from '../shared/api.constants.ts'
import type { GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type SearchQuery, SearchResponseSchema } from './search.schemas.ts'

export const fetchSearchResults = async ({
  YDC_API_KEY = process.env.YDC_API_KEY,
  searchQuery: { query, site, fileType, exactTerms, excludeTerms, ...rest },
  getUserAgent,
}: {
  searchQuery: SearchQuery
  YDC_API_KEY?: string
  getUserAgent: GetUserAgent
}) => {
  const url = new URL(SEARCH_API_URL)

  const searchParams = new URLSearchParams()

  // Build Query Param with search operators
  const searchQuery = [query]
  site && searchQuery.push(`site:${site}`)
  fileType && searchQuery.push(`filetype:${fileType}`)
  if (exactTerms && excludeTerms) {
    throw new Error('Cannot specify both exactTerms and excludeTerms - please use only one')
  }
  exactTerms &&
    searchQuery.push(
      exactTerms
        .split('|')
        .map((term) => `+${term}`)
        .join(' AND '),
    )
  excludeTerms &&
    searchQuery.push(
      excludeTerms
        .split('|')
        .map((term) => `-${term}`)
        .join(' AND '),
    )
  searchParams.append('query', searchQuery.join(' '))

  // Append additional advanced Params
  for (const [name, value] of Object.entries(rest)) {
    if (value) searchParams.append(name, `${value}`)
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
