import { CONTENTS_API_URL } from '../shared/api.constants.ts'
import type { CustomHeaders, GetUserAgent } from '../shared/api.types.ts'
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts'
import { type ContentsApiResponse, ContentsApiResponseSchema, type ContentsQuery } from './contents.schemas.ts'

/**
 * Fetch content from You.com Contents API
 * The API accepts multiple URLs in a single request and returns all results
 * @param contentsQuery - Query parameters including URLs and format
 * @param YDC_API_KEY - You.com API key
 * @param getUserAgent - Function to get User-Agent string
 * @returns Parsed and validated API response
 */
export const fetchContents = async ({
  contentsQuery: { urls, formats, format, crawl_timeout },
  YDC_API_KEY = process.env.YDC_API_KEY,
  getUserAgent,
  customHeaders,
}: {
  contentsQuery: ContentsQuery
  YDC_API_KEY?: string
  getUserAgent: GetUserAgent
  customHeaders?: CustomHeaders
}): Promise<ContentsApiResponse> => {
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY is required for Contents API')
  }

  // Handle backward compatibility: prefer formats array, fallback to format string, default to ['markdown']
  const requestFormats = formats || (format ? [format] : ['markdown'])

  // Build request body
  const requestBody: {
    urls: string[]
    formats: string[]
    crawl_timeout?: number
  } = {
    urls,
    formats: requestFormats,
  }

  if (crawl_timeout !== undefined) {
    requestBody.crawl_timeout = crawl_timeout
  }

  // Make single API call with all URLs
  const options = {
    method: 'POST',
    headers: new Headers({
      ...customHeaders,
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    }),
    body: JSON.stringify(requestBody),
  }

  const response = await fetch(CONTENTS_API_URL, options)

  // Handle HTTP errors
  if (!response.ok) {
    const errorCode = response.status

    // Try to parse error response body
    let errorDetail = `Failed to fetch contents. HTTP ${errorCode}`
    try {
      const errorBody = await response.json()
      if (errorBody && typeof errorBody === 'object' && 'detail' in errorBody) {
        errorDetail = String(errorBody.detail)
      }
    } catch {
      // If parsing fails, use default error message
    }

    // Handle specific error codes
    if (errorCode === 401) {
      throw new Error(`Authentication failed: ${errorDetail}. Please check your You.com API key.`)
    }
    if (errorCode === 403) {
      throw new Error(`Forbidden: ${errorDetail}. Your API key may not have access to the Contents API.`)
    }
    if (errorCode === 429) {
      throw new Error('Rate limited by You.com API. Please try again later.')
    }
    if (errorCode >= 500) {
      throw new Error(`You.com API server error: ${errorDetail}`)
    }

    throw new Error(errorDetail)
  }

  const results = await response.json()

  // Check for error field in 200 responses
  checkResponseForErrors(results)

  // Validate schema
  const parsedResults = ContentsApiResponseSchema.parse(results)

  return parsedResults
}
