import {
  ContentsQuerySchema,
  callExpressAgent,
  ExpressAgentInputSchema,
  fetchContents,
  fetchSearchResults,
  formatContentsResponse,
  formatExpressAgentResponse,
  formatSearchResults,
  SearchQuerySchema,
} from '@youdotcom-oss/mcp';
import { tool } from 'ai';
import packageJson from '../package.json' with { type: 'json' };

/**
 * Configuration for You.com AI SDK tools
 */
export type YouToolsConfig = {
  apiKey?: string;
};

/**
 * Creates a User-Agent string for API requests
 */
const getUserAgent = () => `AI-SDK/${packageJson.version} (You.com; ai-sdk-plugin)`;

/**
 * You.com web search tool for Vercel AI SDK
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @example
 * ```ts
 * import { generateText, stepCountIs } from 'ai';
 * import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
 *
 * const { text } = await generateText({
 *   model: 'anthropic/claude-sonnet-4.5',
 *   prompt: 'What happened in San Francisco last week?',
 *   tools: {
 *     search: youSearch(),
 *   },
 *   stopWhen: stepCountIs(3),
 * });
 * ```
 */
export const youSearch = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description:
      'Search the web for current information, news, articles, and content using You.com. Returns web results with snippets and news articles. Use this when you need up-to-date information or facts from the internet.',
    inputSchema: SearchQuerySchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.');
      }

      const response = await fetchSearchResults({
        searchQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      });

      // Format the response
      const formatted = formatSearchResults(response);

      // Return formatted text and structured data
      return {
        text: formatted.content[0]?.text || '',
        data: {
          hits: response.results.web || [],
          news: response.results.news || [],
          ...formatted.structuredContent,
        },
      };
    },
  });
};

/**
 * You.com AI agent tool for Vercel AI SDK
 *
 * Fast AI responses with optional web search integration.
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @example
 * ```ts
 * import { generateText, stepCountIs } from 'ai';
 * import { youExpress } from '@youdotcom-oss/ai-sdk-plugin';
 *
 * const { text } = await generateText({
 *   model: 'anthropic/claude-sonnet-4.5',
 *   prompt: 'What are the latest AI developments?',
 *   tools: {
 *     agent: youExpress(),
 *   },
 *   stopWhen: stepCountIs(3),
 * });
 * ```
 */
export const youExpress = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description:
      'Fast AI agent powered by You.com that provides quick answers with optional web search. Use this for straightforward queries that benefit from real-time web information.',
    inputSchema: ExpressAgentInputSchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.');
      }

      const response = await callExpressAgent({
        agentInput: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      });

      // Format the response
      const formatted = formatExpressAgentResponse(response);

      // Return formatted text and structured data
      return {
        text: formatted.content.map((c) => c.text).join('\n\n'),
        data: formatted.structuredContent,
      };
    },
  });
};

/**
 * You.com content extraction tool for Vercel AI SDK
 *
 * Extract full page content from URLs in markdown or HTML format.
 *
 * @param config - Configuration options
 * @returns A tool that can be used with AI SDK's generateText, streamText, etc.
 *
 * @example
 * ```ts
 * import { generateText, stepCountIs } from 'ai';
 * import { youContents } from '@youdotcom-oss/ai-sdk-plugin';
 *
 * const { text } = await generateText({
 *   model: 'anthropic/claude-sonnet-4.5',
 *   prompt: 'Summarize the content from vercel.com/blog',
 *   tools: {
 *     extract: youContents(),
 *   },
 *   stopWhen: stepCountIs(3),
 * });
 * ```
 */
export const youContents = (config: YouToolsConfig = {}) => {
  const apiKey = config.apiKey ?? process.env.YDC_API_KEY;

  return tool({
    description:
      'Extract full page content from web URLs using You.com. Returns page content in markdown or HTML format. Use this when you need to read and process entire web pages.',
    inputSchema: ContentsQuerySchema,
    execute: async (params) => {
      if (!apiKey) {
        throw new Error('YDC_API_KEY is required. Set it in environment variables or pass it in config.');
      }

      const response = await fetchContents({
        contentsQuery: params,
        YDC_API_KEY: apiKey,
        getUserAgent,
      });

      // Format the response
      const formatted = formatContentsResponse(response, params.format || 'markdown');

      // Return formatted text and structured data (use raw response for data to preserve markdown/html fields)
      return {
        text: formatted.content[0]?.text || '',
        data: response,
      };
    },
  });
};

// Export types for users
export type {
  ContentsApiResponse,
  ContentsQuery,
  ExpressAgentInput,
  ExpressAgentMcpResponse,
  SearchQuery,
  SearchResponse,
} from '@youdotcom-oss/mcp';
