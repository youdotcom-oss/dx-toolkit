import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { callResearch, generateErrorReportLink, ResearchQuerySchema } from '@youdotcom-oss/api'
import { getLogger } from '../shared/get-logger.ts'
import { ResearchStructuredContentSchema } from './research.schemas.ts'
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
      description: 'Perform deep research with comprehensive answers and cited sources',
      inputSchema: ResearchQuerySchema.shape,
      outputSchema: ResearchStructuredContentSchema.shape,
    },
    async (researchQuery) => {
      const logger = getLogger(mcp)
      try {
        const response = await callResearch({
          researchQuery,
          YDC_API_KEY,
          getUserAgent,
        })

        const sourceCount = response.output.sources.length

        await logger({
          level: 'info',
          data: `Research successful for input: "${researchQuery.input.substring(0, 100)}" - ${sourceCount} source(s)`,
        })

        const { content, structuredContent } = formatResearchResults(response)
        return { content, structuredContent }
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
