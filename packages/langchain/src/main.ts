import { DynamicStructuredTool } from '@langchain/core/tools'
import {
  type ContentsQuery,
  ContentsQuerySchema,
  fetchContents,
  fetchSearchResults,
  type GetUserAgent,
  type SearchQuery,
  SearchQuerySchema,
} from '@youdotcom-oss/api'
import packageJson from '../package.json' with { type: 'json' }

/**
 * Configuration for You.com LangChain tools
 */
export type YouToolsConfig = {
  apiKey?: string
}

/**
 * Configuration for the youSearch tool
 *
 * Extends YouToolsConfig with optional SearchQuery fields as defaults.
 * Any field from SearchQuery (e.g. count, freshness, country, safesearch, livecrawl)
 * can be set at construction and will be used unless overridden at invoke time.
 */
export type YouSearchConfig = YouToolsConfig & Partial<SearchQuery>

/**
 * Configuration for the youContents tool
 *
 * Extends YouToolsConfig with optional ContentsQuery fields as defaults.
 * Any field from ContentsQuery (e.g. formats, crawl_timeout) can be set at construction
 * and will be used unless overridden at invoke time.
 */
export type YouContentsConfig = YouToolsConfig & Partial<ContentsQuery>

/**
 * Creates a User-Agent string for API requests
 */
const getUserAgent: GetUserAgent = () => `LangChain-Plugin/${packageJson.version} (You.com)`

/**
 * You.com web search tool for LangChain
 *
 * Search the web for current information, news, articles, and content.
 * Returns web results with snippets and news articles.
 *
 * @param config - Configuration options
 * @returns A DynamicStructuredTool for use with LangChain agents
 *
 * @public
 */
export const youSearch = (config: YouSearchConfig = {}) => {
  const { apiKey: configApiKey, ...defaults } = config
  const apiKey = configApiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_search',
    description:
      'Search the web for current information, news, articles, and content using You.com. Returns web results with snippets and news articles. Use this when you need up-to-date information or facts from the internet.',
    schema: SearchQuerySchema,
    func: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await fetchSearchResults({
        searchQuery: { ...defaults, ...params },
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return JSON.stringify(response)
    },
  })
}

/**
 * You.com content extraction tool for LangChain
 *
 * Extract full page content from URLs in markdown or HTML format.
 * Content is truncated by default to prevent exceeding LLM context window limits.
 *
 * @param config - Configuration options including maxContentLength
 * @returns A DynamicStructuredTool for use with LangChain agents
 *
 * @public
 */
export const youContents = (config: YouContentsConfig = {}) => {
  const { apiKey: configApiKey, ...defaults } = config
  const apiKey = configApiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_contents',
    description:
      'Extract page content from web URLs using You.com. Returns an array of objects, each with: url (string), title (string), markdown (string, the page content in markdown), html (string, optional), and metadata (object, optional). Read the markdown field to get the page content. Use this when you need to read and process web pages. Note: very large pages may be truncated.',
    schema: ContentsQuerySchema,
    func: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await fetchContents({
        contentsQuery: { ...defaults, ...params },
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return JSON.stringify(response)
    },
  })
}
