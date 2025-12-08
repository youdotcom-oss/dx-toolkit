import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { API_KEY_ENV_VAR, DEFAULT_CLIENT_NAME, DEFAULT_SERVER_URL } from './constants.ts';
import type { YouMCPClientConfig, YouMCPClientResult } from './types.ts';
import { YouMCPClientError } from './types.ts';

/**
 * Creates a You.com MCP client for use with Vercel AI SDK.
 *
 * @example
 * ```typescript
 * import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
 * import { generateText } from 'ai';
 *
 * const { tools, close } = await createYouMCPClient({
 *   apiKey: process.env.YDC_API_KEY,
 * });
 *
 * try {
 *   const result = await generateText({
 *     model: 'anthropic/claude-sonnet-4.5',
 *     tools,
 *     prompt: 'Search for latest AI news',
 *   });
 * } finally {
 *   await close();
 * }
 * ```
 */
export const createYouMCPClient = async (config: YouMCPClientConfig = {}): Promise<YouMCPClientResult> => {
  // Resolve API key from config or environment
  const apiKey = config.apiKey ?? process.env[API_KEY_ENV_VAR];

  if (!apiKey) {
    throw new YouMCPClientError(`API key required. Provide via config.apiKey or ${API_KEY_ENV_VAR} env var.`);
  }

  const serverUrl = config.serverUrl ?? DEFAULT_SERVER_URL;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    ...config.headers,
  };

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>>;

  try {
    // Create MCP client using HTTP transport
    mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: serverUrl,
        headers,
      },
      name: config.clientName ?? DEFAULT_CLIENT_NAME,
      onUncaughtError:
        config.onUncaughtError ??
        ((error: unknown) => {
          console.error('[You.com MCP Client] Uncaught error:', error);
        }),
    });
  } catch (error: unknown) {
    throw new YouMCPClientError(`Failed to create MCP client for ${serverUrl}`, error);
  }

  let tools: Awaited<ReturnType<typeof mcpClient.tools>>;

  try {
    // Fetch tools from MCP server (schema discovery mode)
    // This automatically converts MCP tools to AI SDK tools
    tools = await mcpClient.tools();
  } catch (error: unknown) {
    await mcpClient.close().catch(() => {});
    throw new YouMCPClientError('Failed to fetch tools from MCP server', error);
  }

  return {
    tools,
    client: mcpClient,
    close: async () => {
      await mcpClient.close();
    },
  };
};
