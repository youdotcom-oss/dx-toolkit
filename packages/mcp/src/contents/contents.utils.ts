import { CONTENTS_API_URL } from '../shared/api-constants.ts';
import { checkResponseForErrors } from '../shared/check-response-for-errors.ts';
import {
  type ContentsApiResponse,
  ContentsApiResponseSchema,
  type ContentsQuery,
  type ContentsStructuredContent,
} from './contents.schemas.ts';

/**
 * Fetch content from You.com Contents API
 * The API accepts multiple URLs in a single request and returns all results
 * @param contentsQuery - Query parameters including URLs and format
 * @param YDC_API_KEY - You.com API key
 * @param getUserAgent - Function to get User-Agent string
 * @returns Parsed and validated API response
 */
export const fetchContents = async ({
  contentsQuery: { urls, formats, format, crawl_timeout },
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

  // Handle backward compatibility: prefer formats array, fallback to format string, default to ['markdown']
  const requestFormats = formats || (format ? [format] : ['markdown']);

  // Build request body
  const requestBody: {
    urls: string[];
    formats: string[];
    crawl_timeout?: number;
  } = {
    urls,
    formats: requestFormats,
  };

  if (crawl_timeout !== undefined) {
    requestBody.crawl_timeout = crawl_timeout;
  }

  // Make single API call with all URLs
  const options = {
    method: 'POST',
    headers: new Headers({
      'X-API-Key': YDC_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
    }),
    body: JSON.stringify(requestBody),
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
 * @param formats - Formats used for extraction
 * @returns Formatted response with content and structuredContent
 */
export const formatContentsResponse = (
  response: ContentsApiResponse,
  formats: string[],
): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: ContentsStructuredContent;
} => {
  // Build text content with full extracted content
  const textParts: string[] = [`Successfully extracted content from ${response.length} URL(s):\n`];
  textParts.push(`Formats: ${formats.join(', ')}\n`);

  const items: ContentsStructuredContent['items'] = [];

  for (const item of response) {
    // Add header for this item
    textParts.push(`\n## ${item.title || 'Untitled'}`);
    textParts.push(`URL: ${item.url}\n`);
    textParts.push('---\n');

    // Add content based on requested formats
    if (formats.includes('markdown') && item.markdown) {
      textParts.push('\n### Markdown Content\n');
      textParts.push(item.markdown);
      textParts.push('\n');
    }

    if (formats.includes('html') && item.html) {
      textParts.push('\n### HTML Content\n');
      textParts.push(`Length: ${item.html.length} characters\n`);
      textParts.push(item.html.substring(0, 500));
      if (item.html.length > 500) {
        textParts.push('...\n(truncated for display)');
      }
      textParts.push('\n');
    }

    if (formats.includes('metadata') && item.metadata) {
      textParts.push('\n### Metadata\n');

      if (item.metadata.jsonld && item.metadata.jsonld.length > 0) {
        textParts.push('\n**JSON-LD:**\n');
        textParts.push(JSON.stringify(item.metadata.jsonld, null, 2));
        textParts.push('\n');
      }

      if (item.metadata.opengraph) {
        textParts.push('\n**OpenGraph:**\n');
        for (const [key, value] of Object.entries(item.metadata.opengraph)) {
          textParts.push(`- ${key}: ${value}\n`);
        }
      }

      if (item.metadata.twitter) {
        textParts.push('\n**Twitter:**\n');
        for (const [key, value] of Object.entries(item.metadata.twitter)) {
          textParts.push(`- ${key}: ${value}\n`);
        }
      }
    }

    textParts.push('\n---\n');

    // Add to structured content
    items.push({
      url: item.url,
      title: item.title,
      markdown: item.markdown,
      html: item.html,
      metadata: item.metadata,
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
      formats,
      items,
    },
  };
};
