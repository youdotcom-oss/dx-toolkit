/**
 * Dry-run utilities for testing request construction without API calls
 * These functions build request details (URL, headers, body) that can be inspected
 * without making actual API calls.
 *
 * @public
 */

import type { ContentsQuery } from '../contents/contents.schemas.ts'
import type { ResearchQuery } from '../research/research.schemas.ts'
import type { SearchQuery } from '../search/search.schemas.ts'
import { CONTENTS_API_URL, RESEARCH_API_URL, SEARCH_API_URL } from './api.constants.ts'
import type { CustomHeaders, GetUserAgent } from './api.types.ts'

/**
 * Result structure for dry-run request inspection
 *
 * @public
 */
export type DryRunResult = {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  queryParams?: Record<string, string>
}

/**
 * Build search request details without making API call
 * Useful for testing and debugging query construction
 *
 * @param params - Search query parameters
 * @returns Request details including URL, headers, and query params
 *
 * @public
 */
export const buildSearchRequest = ({
  searchQuery,
  YDC_API_KEY,
  getUserAgent,
  customHeaders,
}: {
  searchQuery: SearchQuery
  YDC_API_KEY: string
  getUserAgent: GetUserAgent
  customHeaders?: CustomHeaders
}): DryRunResult => {
  if (searchQuery.include_domains && searchQuery.exclude_domains) {
    throw new Error('Cannot combine include_domains and exclude_domains')
  }

  return {
    url: SEARCH_API_URL,
    method: 'POST',
    headers: {
      ...customHeaders,
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(searchQuery),
  }
}

/**
 * Build contents request details without making API call
 * Useful for testing and debugging POST body construction
 *
 * @param params - Contents query parameters
 * @returns Request details including URL, headers, and POST body
 *
 * @public
 */
export const buildContentsRequest = ({
  contentsQuery: { urls, formats, format, crawl_timeout },
  YDC_API_KEY,
  getUserAgent,
  customHeaders,
}: {
  contentsQuery: ContentsQuery
  YDC_API_KEY: string
  getUserAgent: GetUserAgent
  customHeaders?: CustomHeaders
}): DryRunResult => {
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

  return {
    url: CONTENTS_API_URL,
    method: 'POST',
    headers: {
      ...customHeaders,
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(requestBody),
  }
}

/**
 * Build research request details without making API call
 * Useful for testing and debugging POST body construction
 *
 * @param params - Research query parameters
 * @returns Request details including URL, headers, and POST body
 *
 * @public
 */
export const buildResearchRequest = ({
  researchQuery,
  YDC_API_KEY,
  getUserAgent,
  customHeaders,
}: {
  researchQuery: ResearchQuery
  YDC_API_KEY: string
  getUserAgent: GetUserAgent
  customHeaders?: CustomHeaders
}): DryRunResult => {
  return {
    url: RESEARCH_API_URL,
    method: 'POST',
    headers: {
      ...customHeaders,
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(researchQuery),
  }
}
