import type { NewsResult, SearchResponse } from '@youdotcom-oss/api'
import { formatSearchResultsText } from '../shared/format-search-results-text.ts'

export const formatSearchResults = (response: SearchResponse) => {
  let formattedResults = ''

  // Format web results using shared utility
  if (response.results.web?.length) {
    const webResults = formatSearchResultsText(response.results.web)
    formattedResults += `WEB RESULTS:\n\n${webResults}`
  }

  // Format news results
  if (response.results.news?.length) {
    const newsResults = response.results.news
      .map(
        (article: NewsResult) =>
          `Title: ${article.title}\nURL: ${article.url}\nDescription: ${article.description}\nPublished: ${article.page_age}`,
      )
      .join('\n\n---\n\n')

    if (formattedResults) {
      formattedResults += `\n\n${'='.repeat(50)}\n\n`
    }
    formattedResults += `NEWS RESULTS:\n\n${newsResults}`
  }

  // Extract fields for structuredContent
  const structuredResults: {
    web?: Array<{ url: string; title: string; page_age?: string }>
    news?: Array<{ url: string; title: string; page_age: string }>
  } = {}

  if (response.results.web?.length) {
    structuredResults.web = response.results.web.map((result) => {
      const item: { url: string; title: string; page_age?: string } = {
        url: result.url,
        title: result.title,
      }
      if (result.page_age) item.page_age = result.page_age
      return item
    })
  }

  if (response.results.news?.length) {
    structuredResults.news = response.results.news.map((article) => ({
      url: article.url,
      title: article.title,
      page_age: article.page_age,
    }))
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: `Search Results for "${response.metadata.query}":\n\n${formattedResults}`,
      },
    ],
    structuredContent: {
      resultCounts: {
        web: response.results.web?.length || 0,
        news: response.results.news?.length || 0,
        total: (response.results.web?.length || 0) + (response.results.news?.length || 0),
      },
      results: Object.keys(structuredResults).length > 0 ? structuredResults : undefined,
    },
    fullResponse: response,
  }
}
