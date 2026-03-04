import { DynamicStructuredTool } from '@langchain/core/tools'
import {
  ContentsQuerySchema,
  callResearch,
  fetchContents,
  fetchSearchResults,
  type GetUserAgent,
  ResearchQuerySchema,
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
      const response = await fetchSearchResults({
        searchQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return JSON.stringify(response)
    },
  })
}

/**
 * You.com research tool for LangChain
 *
 * Perform research with cited sources and configurable effort (lite, standard, deep, exhaustive).
 *
 * @param config - Configuration options
 * @returns A DynamicStructuredTool for use with LangChain agents
 *
 * @public
 */
export const youResearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_research',
    description:
      'Research a topic with comprehensive answers and cited sources using You.com. Supports configurable effort levels (lite, standard, deep, exhaustive). Returns a detailed answer with inline citations and a list of sources. Use this when you need thorough, well-researched answers to complex questions.',
    schema: ResearchQuerySchema,
    func: async (params) => {
      const response = await callResearch({
        researchQuery: params,
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
 *
 * @param config - Configuration options
 * @returns A DynamicStructuredTool for use with LangChain agents
 *
 * @public
 */
export const youContents = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

  return new DynamicStructuredTool({
    name: 'you_contents',
    description:
      'Extract page content from web URLs using You.com. Returns an array of objects, each with: url (string), title (string), markdown (string, the page content in markdown), html (string, optional), and metadata (object, optional). Read the markdown field to get the page content. Use this when you need to read and process web pages.',
    schema: ContentsQuerySchema,
    func: async (params) => {
      const response = await fetchContents({
        contentsQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return JSON.stringify(response)
    },
  })
}
