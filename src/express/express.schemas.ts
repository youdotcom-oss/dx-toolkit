import * as z from 'zod';

export const ExpressAgentInputSchema = z.object({
  input: z.string().min(1, 'Input is required').describe('Query or prompt'),
  tools: z
    .array(
      z.object({
        type: z.enum(['web_search']).describe('Tool type'),
      }),
    )
    .optional()
    .describe('Tools (web search only)'),
});

export type ExpressAgentInput = z.infer<typeof ExpressAgentInputSchema>;

// API Response Schema - Validates the full response from You.com API

// Search result content item from web_search.results
// Note: thumbnail_url, source_type, and provider are API-only pass-through fields not used in MCP output
const ApiSearchResultItemSchema = z.object({
  source_type: z.string().optional(),
  citation_uri: z.string().optional(), // Used as fallback for url in transformation
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  thumbnail_url: z.string().optional(), // API-only, not transformed to MCP output
  provider: z.any().optional(), // API-only, not transformed to MCP output
});

// Union of possible output item types from API
const ExpressAgentApiOutputItemSchema = z.union([
  // web_search.results type - has content array, no text
  z.object({
    type: z.literal('web_search.results'),
    content: z.array(ApiSearchResultItemSchema),
  }),
  // message.answer type - has text, no content
  z.object({
    type: z.literal('message.answer'),
    text: z.string(),
  }),
]);

export const ExpressAgentApiResponseSchema = z
  .object({
    output: z.array(ExpressAgentApiOutputItemSchema),
    agent: z.string().optional().describe('Agent identifier'),
    mode: z.string().optional().describe('Agent mode'),
    input: z.array(z.any()).optional().describe('Input messages'),
  })
  .passthrough();

export type ExpressAgentApiResponse = z.infer<typeof ExpressAgentApiResponseSchema>;

// MCP Output Schema - Defines what we return to the MCP client (answer + optional search results, token efficient)

// Search result item for MCP output
const McpSearchResultItemSchema = z.object({
  url: z.string().describe('URL'),
  title: z.string().describe('Title'),
  snippet: z.string().describe('Snippet'),
});

// MCP response structure: answer (always) + results (optional when web_search used)
const ExpressAgentMcpResponseSchema = z.object({
  answer: z.string().describe('AI answer'),
  results: z
    .object({
      web: z.array(McpSearchResultItemSchema).describe('Web results'),
    })
    .optional()
    .describe('Search results'),
  agent: z.string().optional().describe('Agent ID'),
});

export type ExpressAgentMcpResponse = z.infer<typeof ExpressAgentMcpResponseSchema>;

// Minimal schema for structuredContent (reduces payload duplication)
export const ExpressStructuredContentSchema = z.object({
  answer: z.string().describe('AI answer'),
  hasResults: z.boolean().describe('Has web results'),
  resultCount: z.number().describe('Result count'),
  agent: z.string().optional().describe('Agent ID'),
  results: z
    .object({
      web: z
        .array(
          z.object({
            url: z.string().describe('URL'),
            title: z.string().describe('Title'),
          }),
        )
        .optional()
        .describe('Web results'),
    })
    .optional()
    .describe('Search results'),
});
