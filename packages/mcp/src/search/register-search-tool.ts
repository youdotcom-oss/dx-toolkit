import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  fetchSearchResults,
  generateErrorReportLink,
  SearchQuerySchema,
  SearchResponseSchema,
} from '@youdotcom-oss/api'
import { getLogger } from '../shared/get-logger.ts'
import { formatSearchResults } from './search.utils.ts'

export const registerSearchTool = ({
  mcp,
  YDC_API_KEY,
  getUserAgent,
}: {
  mcp: McpServer
  YDC_API_KEY?: string
  getUserAgent: () => string
}) => {
  mcp.registerTool(
    'you-search',
    {
      title: 'Web Search',
      description:
        'Web and news search via You.com. Supports domain filtering, language selection, livecrawl for full page content, and date freshness controls.',
      inputSchema: SearchQuerySchema.shape,
      outputSchema: SearchResponseSchema,
    },
    async (searchQuery, { sendNotification }) => {
      const logger = getLogger(sendNotification)
      try {
        const response = await fetchSearchResults({
          searchQuery,
          YDC_API_KEY,
          getUserAgent,
        })

        const webCount = response.results.web?.length ?? 0
        const newsCount = response.results.news?.length ?? 0

        if (!webCount && !newsCount) {
          await logger({
            level: 'info',
            data: `No results found for query: "${searchQuery.query}"`,
          })

          return {
            content: [{ type: 'text' as const, text: 'No results found.' }],
            structuredContent: response,
          }
        }

        await logger({
          level: 'info',
          data: `Search successful for query: "${searchQuery.query}" - ${webCount} web results, ${newsCount} news results (${webCount + newsCount} total)`,
        })

        const content = formatSearchResults(response)
        return { content, structuredContent: response }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        const reportLink = generateErrorReportLink({
          errorMessage,
          tool: 'you-search',
          clientInfo: getUserAgent(),
        })

        await logger({
          level: 'error',
          data: `Search API call failed: ${errorMessage}\n\nReport this issue: ${reportLink}`,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          structuredContent: undefined,
          isError: true,
        }
      }
    },
  )
}
