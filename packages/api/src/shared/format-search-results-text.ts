type GenericSearchResult = {
  url: string
  title: string
  description?: string
  snippet?: string
  snippets?: string[]
  page_age?: string
}

/**
 * Formats an array of search results into human-readable display text.
 *
 * @param results - Array of search results to format
 * @returns Formatted string with each result separated by double newlines
 *
 * @public
 */
export const formatSearchResultsText = (results: GenericSearchResult[]): string => {
  return results
    .map((result) => {
      const parts: string[] = [`Title: ${result.title}`]

      parts.push(`URL: ${result.url}`)

      if (result.page_age) {
        parts.push(`Published: ${result.page_age}`)
      }

      if (result.description) {
        parts.push(`Description: ${result.description}`)
      }

      if (result.snippets && result.snippets.length > 0) {
        parts.push(`Snippets:\n- ${result.snippets.join('\n- ')}`)
      } else if (result.snippet) {
        parts.push(`Snippet: ${result.snippet}`)
      }

      return parts.join('\n')
    })
    .join('\n\n')
}
