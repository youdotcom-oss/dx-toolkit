import type { ExpressAgentMcpResponse } from '@youdotcom-oss/api'
import { formatSearchResultsText } from '../shared/format-search-results-text.ts'

export const formatExpressAgentResponse = (response: ExpressAgentMcpResponse) => {
  const _agentId = response.agent || 'express'
  const content: Array<{ type: 'text'; text: string }> = []

  // 1. Answer first (always present)
  content.push({
    type: 'text',
    text: `Express Agent Answer:\n\n${response.answer}`,
  })

  // 2. Search results second (if present when web_search tool was used) - without URLs in text
  if (response.results?.web?.length) {
    const formattedResults = formatSearchResultsText(response.results.web)
    content.push({
      type: 'text',
      text: `\nSearch Results:\n\n${formattedResults}`,
    })
  }

  // Extract URLs and titles for structuredContent
  const structuredResults = response.results?.web?.length
    ? {
        web: response.results.web.map((result) => ({
          url: result.url,
          title: result.title,
        })),
      }
    : undefined

  return {
    content,
    structuredContent: {
      answer: response.answer,
      hasResults: !!response.results?.web?.length,
      resultCount: response.results?.web?.length || 0,
      agent: response.agent,
      results: structuredResults,
    },
    fullResponse: response,
  }
}
