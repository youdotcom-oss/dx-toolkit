import type { ContentsApiResponse } from '@youdotcom-oss/api'

/**
 * Format contents API response for MCP output
 * @param response - Validated API response
 * @param formats - Formats used for extraction
 * @returns Text content blocks for the MCP response
 */
export const formatContentsResponse = (
  response: ContentsApiResponse,
  formats: string[],
): Array<{ type: 'text'; text: string }> => {
  const textParts: string[] = [`Successfully extracted content from ${response.length} URL(s):\n`]
  textParts.push(`Formats: ${formats.join(', ')}\n`)

  for (const item of response) {
    textParts.push(`\n## ${item.title || 'Untitled'}`)
    textParts.push(`URL: ${item.url}\n`)
    textParts.push('---\n')

    if (formats.includes('markdown') && item.markdown) {
      textParts.push('\n### Markdown Content\n')
      textParts.push(item.markdown)
      textParts.push('\n')
    }

    if (formats.includes('html') && item.html) {
      // Text output is a brief preview only — full HTML is in structuredContent.output[].html
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
  }

  return [
    {
      type: 'text',
      text: textParts.join('\n'),
    },
  ]
}
