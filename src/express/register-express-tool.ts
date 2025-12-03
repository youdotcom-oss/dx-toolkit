import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateErrorReportLink } from '../shared/generate-error-report-link.ts';
import { getLogger } from '../shared/get-logger.ts';
import { ExpressAgentInputSchema, ExpressStructuredContentSchema } from './express.schemas.ts';
import { callExpressAgent, formatExpressAgentResponse } from './express.utils.ts';

export const registerExpressTool = ({
  mcp,
  YDC_API_KEY,
  getUserAgent,
}: {
  mcp: McpServer;
  YDC_API_KEY?: string;
  getUserAgent: () => string;
}) => {
  mcp.registerTool(
    'you-express',
    {
      title: 'Express Agent',
      description: 'Fast AI answers with web search',
      inputSchema: ExpressAgentInputSchema.shape,
      outputSchema: ExpressStructuredContentSchema.shape,
    },
    async (agentInput) => {
      const logger = getLogger(mcp);

      try {
        const response = await callExpressAgent({
          agentInput,
          YDC_API_KEY,
          getUserAgent,
        });

        await logger({
          level: 'info',
          data: `Express agent call successful for input: "${agentInput.input}"`,
        });

        const { content, structuredContent } = formatExpressAgentResponse(response);
        return { content, structuredContent };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const reportLink = generateErrorReportLink({
          errorMessage,
          tool: 'you-express',
          clientInfo: getUserAgent(),
        });

        await logger({
          level: 'error',
          data: `Express agent call failed: ${errorMessage}\n\nReport this issue: ${reportLink}`,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          structuredContent: undefined,
          isError: true,
        };
      }
    },
  );
};
