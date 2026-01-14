/**
 * Generic search result type that works for both Search and Express APIs
 * Used by both search.utils.ts and express.utils.ts
 */
type GenericSearchResult = {
  url: string;
  title: string;
  description?: string;
  snippet?: string;
  snippets?: string[];
  page_age?: string;
};

/**
 * Format array of search results into display text
 * Used by both search and express agent formatting
 * @param results - Array of search results to format
 */
export const formatSearchResultsText = (results: GenericSearchResult[]): string => {
  return results
    .map((result) => {
      const parts: string[] = [`Title: ${result.title}`];

      // Add URL
      parts.push(`URL: ${result.url}`);

      // Add page age if present
      if (result.page_age) {
        parts.push(`Published: ${result.page_age}`);
      }

      // Add description if present (from Search API)
      if (result.description) {
        parts.push(`Description: ${result.description}`);
      }

      // Handle snippets array (from Search API)
      if (result.snippets && result.snippets.length > 0) {
        parts.push(`Snippets:\n- ${result.snippets.join('\n- ')}`);
      }
      // Handle single snippet (from Express API)
      else if (result.snippet) {
        parts.push(`Snippet: ${result.snippet}`);
      }

      return parts.join('\n');
    })
    .join('\n\n');
};
