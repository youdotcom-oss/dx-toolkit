import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { callResearch, generateErrorReportLink, ResearchQuerySchema, ResearchResponseSchema } from '@youdotcom-oss/api'
import { getLogger } from '../shared/get-logger.ts'
import { formatResearchResults } from './research.utils.ts'

export const registerResearchTool = ({
  mcp,
  YDC_API_KEY,
  getUserAgent,
}: {
  mcp: McpServer
  YDC_API_KEY?: string
  getUserAgent: () => string
}) => {
  mcp.registerTool(
    'you-research',
    {
      title: 'Research',
      description:
        'Research a topic with comprehensive answers and cited sources. Configurable effort levels (lite, standard, deep, exhaustive).',
      inputSchema: ResearchQuerySchema.shape,
      outputSchema: ResearchResponseSchema,
    },
    async (researchQuery, { sendNotification }) => {
      const logger = getLogger(sendNotification)
      try {
        const response = await callResearch({
          researchQuery,
          YDC_API_KEY,
          getUserAgent,
        })

        const sourceCount = response.output.sources.length

        await logger({
          level: 'info',
          data: `Research for "${researchQuery.input.substring(0, 100)}" complete: ${sourceCount} source(s)`,
        })

        const content = formatResearchResults(response)
        return { content, structuredContent: response }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        const reportLink = generateErrorReportLink({
          errorMessage,
          tool: 'you-research',
          clientInfo: getUserAgent(),
        })

        await logger({
          level: 'error',
          data: `Research API call failed: ${errorMessage}\n\nReport this issue: ${reportLink}`,
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
