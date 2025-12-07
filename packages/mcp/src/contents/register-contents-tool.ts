import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateErrorReportLink } from '../shared/generate-error-report-link.ts';
import { getLogger } from '../shared/get-logger.ts';
import { ContentsQuerySchema, ContentsStructuredContentSchema } from './contents.schemas.ts';
import { fetchContents, formatContentsResponse } from './contents.utils.ts';

/**
 * Register the you-contents tool with the MCP server
 * Extracts and returns full content from multiple URLs in markdown or HTML format
 */
export const registerContentsTool = ({
  mcp,
  YDC_API_KEY,
  getUserAgent,
}: {
  mcp: McpServer;
  YDC_API_KEY?: string;
  getUserAgent: () => string;
}) => {
  // Register the tool
  mcp.registerTool(
    'you-contents',
    {
      title: 'Extract Web Page Contents',
      description: 'Extract page content in markdown or HTML',
      inputSchema: ContentsQuerySchema.shape,
      outputSchema: ContentsStructuredContentSchema.shape,
    },
    async (toolInput) => {
      const logger = getLogger(mcp);

      try {
        // Validate and parse input
        const contentsQuery = ContentsQuerySchema.parse(toolInput);
        const { urls, format = 'markdown' } = contentsQuery;

        // Log the request
        await logger({
          level: 'info',
          data: `Contents API call initiated for ${urls.length} URL(s) with format: ${format}`,
        });

        // Fetch contents from API
        const response = await fetchContents({
          contentsQuery,
          YDC_API_KEY,
          getUserAgent,
        });

        // Format response with full content
        const { content, structuredContent } = formatContentsResponse(response, format);

        // Log success
        await logger({
          level: 'info',
          data: `Contents API call successful: extracted ${response.length} page(s)`,
        });

        return {
          content,
          structuredContent,
        };
      } catch (err: unknown) {
        // Handle and log errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        const reportLink = generateErrorReportLink({
          errorMessage,
          tool: 'you-contents',
          clientInfo: getUserAgent(),
        });

        await logger({
          level: 'error',
          data: `Contents API call failed: ${errorMessage}\n\nReport this issue: ${reportLink}`,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Error extracting contents: ${errorMessage}`,
            },
          ],
          structuredContent: undefined,
          isError: true,
        };
      }
    },
  );
};
