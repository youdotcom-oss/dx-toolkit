import type { experimental_MCPClient as MCPClient } from '@ai-sdk/mcp';

/**
 * Configuration options for creating the You.com MCP client
 */
export type YouMCPClientConfig = {
  apiKey?: string; // You.com API key (or use YDC_API_KEY env var)
  serverUrl?: string; // Default: 'http://localhost:4000/mcp'
  headers?: Record<string, string>;
  clientName?: string; // Default: 'youdotcom-ai-sdk-plugin'
  onUncaughtError?: (error: unknown) => void;
};

/**
 * Return type from createYouMCPClient factory function
 */
export type YouMCPClientResult = {
  tools: Awaited<ReturnType<MCPClient['tools']>>; // AI SDK tools (pass to generateText)
  client: MCPClient; // Underlying MCP client (for resources/prompts)
  close: () => Promise<void>; // Cleanup function
};

export class YouMCPClientError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'YouMCPClientError';
  }
}
