import {
  ContentsQuerySchema,
  callResearch,
  fetchContents,
  fetchSearchResults,
  type GetUserAgent,
  type ResearchQuery,
  ResearchQuerySchema,
  SearchQuerySchema,
} from '@youdotcom-oss/api'
import { tool } from 'ai'
import packageJson from '../package.json' with { type: 'json' }

/**
 * Configuration for You.com AI SDK tools
 */
export type YouToolsConfig = {
  apiKey?: string
}

/**
 * Configuration for the youResearch tool
 *
 * Extends YouToolsConfig with optional ResearchQuery fields as defaults.
 * Any field from ResearchQuery (e.g. research_effort) can be set at construction
 * and will be used unless overridden at invoke time.
 */
export type YouResearchConfig = YouToolsConfig & Partial<ResearchQuery>

/**
 * Creates a User-Agent string for API requests
 */
const getUserAgent: GetUserAgent = () =>
  `AI-SDK-Plugin/${packageJson.version} (You.com;${process.env.NEXT_PUBLIC_SITE_URL || ''})`

/**
 * You.com web search tool for Vercel AI SDK
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @public
 */
export const youSearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

  return tool({
    description:
      'Search the web for current information, news, articles, and content using You.com. Returns web results with snippets and news articles. Use this when you need up-to-date information or facts from the internet.',
    inputSchema: SearchQuerySchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await fetchSearchResults({
        searchQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      // Return raw API response for maximum flexibility
      return response
    },
  })
}

/**
 * You.com research tool for Vercel AI SDK
 *
 * Perform research with cited sources and configurable effort (lite, standard, deep, exhaustive).
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @public
 */
export const youResearch = (config: YouResearchConfig = {}) => {
  const { apiKey: configApiKey, ...defaults } = config
  const apiKey = configApiKey ?? process.env.YDC_API_KEY

  return tool({
    description:
      'Research a topic with comprehensive answers and cited sources using You.com. Supports configurable effort levels (lite, standard, deep, exhaustive). Returns a detailed answer with inline citations and a list of sources. Use this when you need thorough, well-researched answers to complex questions.',
    inputSchema: ResearchQuerySchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await callResearch({
        researchQuery: { ...defaults, ...params },
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      return response
    },
  })
}

/**
 * You.com content extraction tool for Vercel AI SDK
 *
 * Extract full page content from URLs in markdown or HTML format.
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @public
 */
export const youContents = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY

  return tool({
    description:
      'Extract full page content from web URLs using You.com. Returns page content in markdown or HTML format. Use this when you need to read and process entire web pages.',
    inputSchema: ContentsQuerySchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.')
      }

      const response = await fetchContents({
        contentsQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      })

      // Return raw API response for maximum flexibility
      return response
    },
  })
}
