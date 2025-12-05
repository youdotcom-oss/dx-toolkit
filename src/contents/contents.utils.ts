import { checkResponseForErrors } from '../shared/check-response-for-errors.ts';
import {
  type ContentsApiResponse,
  ContentsApiResponseSchema,
  type ContentsQuery,
  type ContentsStructuredContent,
} from './contents.schemas.ts';

const CONTENTS_API_URL = 'https://ydc-index.io/v1/contents';

/**
 * Fetch content from You.com Contents API
 * The API accepts multiple URLs in a single request and returns all results
 * @param contentsQuery - Query parameters including URLs and format
 * @param YDC_API_KEY - You.com API key
 * @param getUserAgent - Function to get User-Agent string
 * @returns Parsed and validated API response
 */
export const fetchContents = async ({
  contentsQuery: { urls, format = 'markdown' },
  YDC_API_KEY = process.env.YDC_API_KEY,
  getUserAgent,
}: {
  contentsQuery: ContentsQuery;
  YDC_API_KEY?: string;
  getUserAgent: () => string;
}): Promise<ContentsApiResponse> => {
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY is required for Contents API');
  }

  // Make single API call with all URLs
  const options = {
    method: 'POST',
    headers: new Headers({
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    }),
    body: JSON.stringify({
      urls,
      format,
    }),
  };

  const response = await fetch(CONTENTS_API_URL, options);

  // Handle HTTP errors
  if (!response.ok) {
    const errorCode = response.status;

    // Try to parse error response body
    let errorDetail = `Failed to fetch contents. HTTP ${errorCode}`;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === 'object' && 'detail' in errorBody) {
        errorDetail = String(errorBody.detail);
      }
    } catch {
      // If parsing fails, use default error message
    }

    // Handle specific error codes
    if (errorCode === 401) {
      throw new Error(`Authentication failed: ${errorDetail}. Please check your You.com API key.`);
    }
    if (errorCode === 403) {
      throw new Error(`Forbidden: ${errorDetail}. Your API key may not have access to the Contents API.`);
    }
    if (errorCode === 429) {
      throw new Error('Rate limited by You.com API. Please try again later.');
    }
    if (errorCode >= 500) {
      throw new Error(`You.com API server error: ${errorDetail}`);
    }

    throw new Error(errorDetail);
  }

  const results = await response.json();

  // Check for error field in 200 responses
  checkResponseForErrors(results);

  // Validate schema
  const parsedResults = ContentsApiResponseSchema.parse(results);

  return parsedResults;
};

/**
 * Format contents API response for MCP output
 * Returns full content in both text and structured formats
 * @param response - Validated API response
 * @param format - Format used for extraction
 * @returns Formatted response with content and structuredContent
 */
export const formatContentsResponse = (
  response: ContentsApiResponse,
  format: string,
): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: ContentsStructuredContent;
} => {
  // Build text content with full extracted content
  const textParts: string[] = [`Successfully extracted content from ${response.length} URL(s):\n`];

  const items: ContentsStructuredContent['items'] = [];

  for (const item of response) {
    const contentField = format === 'html' ? item.html : item.markdown;
    const content = contentField || '';

    // Add full content for this item
    textParts.push(`\n## ${item.title}`);
    textParts.push(`URL: ${item.url}`);
    textParts.push(`Format: ${format}`);
    textParts.push(`Content Length: ${content.length} characters\n`);
    textParts.push('---\n');
    textParts.push(content);
    textParts.push('\n---\n');

    // Add to structured content with full content
    items.push({
      url: item.url,
      title: item.title,
      content,
      contentLength: content.length,
    });
  }

  return {
    content: [
      {
        type: 'text',
        text: textParts.join('\n'),
      },
    ],
    structuredContent: {
      count: response.length,
      format,
      items,
    },
  };
};
