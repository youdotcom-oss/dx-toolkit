import { DynamicStructuredTool } from '@langchain/core/tools'
import {
  ContentsQuerySchema,
  callDeepSearch,
  DeepSearchQuerySchema,
  fetchContents,
  fetchSearchResults,
  type GetUserAgent,
  SearchQuerySchema,
} from '@youdotcom-oss/api'
import packageJson from '../package.json' with { type: 'json' }

/**
 * Default maximum character length for content returned by youContents.
 * Prevents exceeding LLM context window limits when extracted pages are very large.
 */
const DEFAULT_MAX_CONTENT_LENGTH = 150_000

/**
 * Configuration for You.com LangChain tools
 */
export type YouToolsConfig = {
  apiKey?: string
}

/**
 * Configuration for the youContents tool
 */
export type YouContentsConfig = YouToolsConfig & {
  /** Maximum character length for markdown/html content per URL. Defaults to 50,000. Set to 0 to disable truncation. */
  maxContentLength?: number
}

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
export const youSearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

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
        searchQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return response
    },
  })
}

/**
 * You.com deep search tool for LangChain
 *
 * Perform in-depth research on complex queries requiring multi-step reasoning.
 * Returns a comprehensive answer with inline citations and source URLs.
 *
 * @param config - Configuration options
 * @returns A DynamicStructuredTool for use with LangChain agents
 *
 * @public
 */
export const youDeepSearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_deep_search',
    description:
      'Perform deep research on complex queries using You.com. Returns a comprehensive answer with inline citations and source URLs. Use this for research questions requiring in-depth investigation and multi-step reasoning.',
    schema: DeepSearchQuerySchema,
    func: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await callDeepSearch({
        deepSearchQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return response
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
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY
  const maxLen = config.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH

  return new DynamicStructuredTool({
    name: 'you_contents',
    description:
      'Extract page content from web URLs using You.com. Returns page content in markdown or HTML format. Use this when you need to read and process web pages. Note: very large pages may be truncated.',
    schema: ContentsQuerySchema,
    func: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await fetchContents({
        contentsQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      if (maxLen <= 0) return response

      return response.map((item) => ({
        ...item,
        markdown: item.markdown ? truncateContent(item.markdown, maxLen) : item.markdown,
        html: item.html ? truncateContent(item.html, maxLen) : item.html,
      }))
    },
  })
}

const truncateContent = (content: string, maxLength: number): string => {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}\n\n[Content truncated at ${maxLength.toLocaleString()} characters]`
}
