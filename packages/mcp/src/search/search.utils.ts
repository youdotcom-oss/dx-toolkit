import type { SearchResponse } from '@youdotcom-oss/api'
import { formatSearchResultsText } from '../shared/format-search-results-text.ts'

export const formatSearchResults = (response: SearchResponse) => {
  let formattedResults = ''

  // Format web results using shared utility
  if (response.results.web?.length) {
    const webResults = formatSearchResultsText(response.results.web)
    formattedResults += `WEB RESULTS:\n\n${webResults}`
  }

  // Format news results using shared utility (consistent with web formatting)
  if (response.results.news?.length) {
    const newsResults = formatSearchResultsText(response.results.news)

    if (formattedResults) {
      formattedResults += `\n\n${'='.repeat(50)}\n\n`
    }
    formattedResults += `NEWS RESULTS:\n\n${newsResults}`
  }

  // Extract fields for structuredContent
  const structuredResults: {
    web?: Array<{
      url: string
      title: string
      page_age?: string
      snippets?: string[]
      contents?: { html?: string; markdown?: string }
    }>
    news?: Array<{ url: string; title: string; page_age: string; contents?: { html?: string; markdown?: string } }>
  } = {}

  if (response.results.web?.length) {
    structuredResults.web = response.results.web.map((result) => {
      const item: {
        url: string
        title: string
        page_age?: string
        snippets?: string[]
        contents?: { html?: string; markdown?: string }
      } = {
        url: result.url,
        title: result.title,
      }
      if (result.page_age) item.page_age = result.page_age
      if (result.snippets?.length) item.snippets = result.snippets
      if (result.contents) item.contents = result.contents ?? undefined
      return item
    })
  }

  if (response.results.news?.length) {
    structuredResults.news = response.results.news.map((article) => {
      const item: { url: string; title: string; page_age: string; contents?: { html?: string; markdown?: string } } = {
        url: article.url,
        title: article.title,
        page_age: article.page_age,
      }
      if (article.contents) item.contents = article.contents ?? undefined
      return item
    })
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
