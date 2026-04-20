import type { SearchResponse } from '@youdotcom-oss/api'
import { formatSearchResultsText } from '../shared/format-search-results-text.ts'

export const formatSearchResults = (response: SearchResponse) => {
  let formattedResults = ''

  if (response.results.web?.length) {
    const webResults = formatSearchResultsText(response.results.web)
    formattedResults += `WEB RESULTS:\n\n${webResults}`
  }

  if (response.results.news?.length) {
    const newsResults = formatSearchResultsText(response.results.news)

    if (formattedResults) {
      formattedResults += `\n\n${'='.repeat(50)}\n\n`
    }
    formattedResults += `NEWS RESULTS:\n\n${newsResults}`
  }

  return [
    {
      type: 'text' as const,
      text: `Search Results for "${response.metadata.query}":\n\n${formattedResults}`,
    },
  ]
}
