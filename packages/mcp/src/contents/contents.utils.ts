import type { ContentsApiResponse } from '@youdotcom-oss/api'
import type { ContentsStructuredContent } from './contents.schemas.ts'

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
  content: Array<{ type: 'text'; text: string }>
  structuredContent: ContentsStructuredContent
} => {
  // Build text content with full extracted content
  const textParts: string[] = [`Successfully extracted content from ${response.length} URL(s):\n`]
  textParts.push(`Formats: ${formats.join(', ')}\n`)

  const items: ContentsStructuredContent['items'] = []

  for (const item of response) {
    // Add header for this item
    textParts.push(`\n## ${item.title || 'Untitled'}`)
    textParts.push(`URL: ${item.url}\n`)
    textParts.push('---\n')

    // Add content based on requested formats
    if (formats.includes('markdown') && item.markdown) {
      textParts.push('\n### Markdown Content\n')
      textParts.push(item.markdown)
      textParts.push('\n')
    }

    if (formats.includes('html') && item.html) {
      // Text output is a brief preview only — full HTML is in structuredContent.items[].html
      textParts.push('\n### HTML Content\n')
      textParts.push(`Length: ${item.html.length} characters\n`)
      textParts.push(item.html.substring(0, 500))
      if (item.html.length > 500) {
        textParts.push('...\n(truncated for display — full HTML available in structuredContent)')
      }
      textParts.push('\n')
    }

    if (formats.includes('metadata') && item.metadata) {
      textParts.push('\n### Metadata\n')

      if (item.metadata.site_name) {
        textParts.push(`**Site Name:** ${item.metadata.site_name}\n`)
      }

      if (item.metadata.favicon_url) {
        textParts.push(`**Favicon:** ${item.metadata.favicon_url}\n`)
      }
    }

    textParts.push('\n---\n')

    // Add to structured content
    items.push({
      url: item.url,
      title: item.title ?? undefined,
      markdown: item.markdown ?? undefined,
      html: item.html ?? undefined,
      metadata: item.metadata ?? undefined,
    })
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
  }
}
