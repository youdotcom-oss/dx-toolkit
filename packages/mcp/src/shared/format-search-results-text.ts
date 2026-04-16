/**
 * Generic search result type for Search API results
 * Used by search.utils.ts
 */
type GenericSearchResult = {
  url: string
  title: string
  description?: string
  snippet?: string
  snippets?: string[]
  page_age?: string
  contents?: { html?: string; markdown?: string }
}

/**
 * Format a character count with locale-aware number formatting
 */
const formatCharCount = (count: number): string => count.toLocaleString()

/**
 * Format array of search results into display text
 * Used by search result formatting
 * @param results - Array of search results to format
 */
export const formatSearchResultsText = (results: GenericSearchResult[]): string => {
  return results
    .map((result) => {
      const parts: string[] = [`Title: ${result.title}`]

      // Add URL
      parts.push(`URL: ${result.url}`)

      // Add page age if present
      if (result.page_age) {
        parts.push(`Published: ${result.page_age}`)
      }

      // Add description if present (from Search API)
      if (result.description) {
        parts.push(`Description: ${result.description}`)
      }

      // Handle snippets array (from Search API)
      if (result.snippets && result.snippets.length > 0) {
        parts.push(`Snippets:\n- ${result.snippets.join('\n- ')}`)
      }
      // Handle single snippet
      else if (result.snippet) {
        parts.push(`Snippet: ${result.snippet}`)
      }

      // Add contents indicator if livecrawl returned page content
      if (result.contents) {
        const formats: string[] = []
        if (result.contents.markdown) {
          formats.push(`${formatCharCount(result.contents.markdown.length)} chars (markdown)`)
        }
        if (result.contents.html) {
          formats.push(`${formatCharCount(result.contents.html.length)} chars (html)`)
        }
        if (formats.length > 0) {
          parts.push(`Page content available: ${formats.join(', ')}`)
        }
      }

      return parts.join('\n')
    })
    .join('\n\n')
}
