// Zod validation schemas for teams-mcp-client

import { z } from 'zod';

/**
 * Validation schema for McpPluginConfig
 */
export const McpPluginConfigSchema = z
  .object({
    apiKey: z.string().min(1, 'API key cannot be empty').optional().describe('You.com API key'),
    mcpUrl: z.string().url('MCP URL must be a valid URL').optional().describe('MCP server URL'),
    headers: z.record(z.string(), z.string()).optional().describe('Additional HTTP headers'),
    timeout: z
      .number()
      .int('Timeout must be an integer')
      .positive('Timeout must be positive')
      .max(300000, 'Timeout cannot exceed 5 minutes (300000ms)')
      .optional()
      .describe('Request timeout in milliseconds'),
    debug: z.boolean().optional().describe('Enable debug logging'),
  })
  .strict();

/**
 * Type inferred from the validation schema
 */
export type ValidatedMcpPluginConfig = z.infer<typeof McpPluginConfigSchema>;
