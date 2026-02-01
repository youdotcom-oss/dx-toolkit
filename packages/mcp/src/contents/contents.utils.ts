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
      textParts.push('\n### HTML Content\n')
      textParts.push(`Length: ${item.html.length} characters\n`)
      textParts.push(item.html.substring(0, 500))
      if (item.html.length > 500) {
        textParts.push('...\n(truncated for display)')
      }
      textParts.push('\n')
    }

    if (formats.includes('metadata') && item.metadata) {
      textParts.push('\n### Metadata\n')

      if (item.metadata.jsonld && item.metadata.jsonld.length > 0) {
        textParts.push('\n**JSON-LD:**\n')
        const jsonldStr = JSON.stringify(item.metadata.jsonld, null, 2)
        if (jsonldStr.length > 2000) {
          textParts.push(jsonldStr.substring(0, 2000))
          textParts.push('\n...(truncated for display, see structuredContent for full data)')
        } else {
          textParts.push(jsonldStr)
        }
        textParts.push('\n')
      }

      if (item.metadata.opengraph) {
        textParts.push('\n**OpenGraph:**\n')
        for (const [key, value] of Object.entries(item.metadata.opengraph)) {
          textParts.push(`- ${key}: ${value}\n`)
        }
      }

      if (item.metadata.twitter) {
        textParts.push('\n**Twitter:**\n')
        for (const [key, value] of Object.entries(item.metadata.twitter)) {
          textParts.push(`- ${key}: ${value}\n`)
        }
      }
    }

    textParts.push('\n---\n')

    // Add to structured content
    items.push({
      url: item.url,
      title: item.title,
      markdown: item.markdown,
      html: item.html,
      metadata: item.metadata,
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
