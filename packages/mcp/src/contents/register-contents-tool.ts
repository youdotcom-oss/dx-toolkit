import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  ContentsApiResponseSchema,
  ContentsQuerySchema,
  fetchContents,
  generateErrorReportLink,
} from '@youdotcom-oss/api'
import * as z from 'zod'
import { getLogger } from '../shared/get-logger.ts'
import { formatContentsResponse } from './contents.utils.ts'

/**
 * Register the you-contents tool with the MCP server
 * Extracts and returns full content from multiple URLs in markdown or HTML format
 */
export const registerContentsTool = ({
  mcp,
  YDC_API_KEY,
  getUserAgent,
}: {
  mcp: McpServer
  YDC_API_KEY?: string
  getUserAgent: () => string
}) => {
  // Register the tool
  mcp.registerTool(
    'you-contents',
    {
      title: 'Extract Web Page Contents',
      description: 'Extract page content in markdown or HTML',
      inputSchema: ContentsQuerySchema.shape,
      outputSchema: z.object({
        output: ContentsApiResponseSchema,
      }),
        output: ContentsApiResponseSchema,
      }).shape,
    },
    async (contentsQuery, { sendNotification }) => {
      const logger = getLogger(sendNotification)

      try {
        // Validate and parse input
        const { urls, formats, format, crawl_timeout } = contentsQuery

        // Handle backward compatibility: prefer formats array, fallback to format string, default to ['markdown']
        const requestFormats = formats || (format ? [format] : ['markdown'])

        // Log the request
        const timeoutInfo = crawl_timeout ? ` with timeout: ${crawl_timeout}s` : ''
        await logger({
          level: 'info',
          data: `Contents API call initiated for ${urls.length} URL(s) with formats: ${requestFormats.join(', ')}${timeoutInfo}`,
        })

        // Fetch contents from API
        const response = await fetchContents({
          contentsQuery,
          YDC_API_KEY,
          getUserAgent,
        })

        // Format response with full content
        const content = formatContentsResponse(response, requestFormats)

        // Log success
        await logger({
          level: 'info',
          data: `Contents API call successful: extracted ${response.length} page(s)`,
        })

        return {
          content,
          structuredContent: {
            output: response,
          },
        }
      } catch (err: unknown) {
        // Handle and log errors
        const errorMessage = err instanceof Error ? err.message : String(err)
        const reportLink = generateErrorReportLink({
          errorMessage,
          tool: 'you-contents',
          clientInfo: getUserAgent(),
        })

        await logger({
          level: 'error',
          data: `Contents API call failed: ${errorMessage}\n\nReport this issue: ${reportLink}`,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: `Error extracting contents: ${errorMessage}`,
            },
          ],
          structuredContent: undefined,
          isError: true,
        }
      }
    },
  )
}
