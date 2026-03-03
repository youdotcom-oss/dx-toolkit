import type { ResearchResponse } from '@youdotcom-oss/api'
import { formatResearchResponse } from '@youdotcom-oss/api'
import type { ResearchStructuredContent } from './research.schemas.ts'

export const formatResearchResults = (
  response: ResearchResponse,
): {
  content: Array<{ type: 'text'; text: string }>
  structuredContent: ResearchStructuredContent
} => {
  const text = formatResearchResponse(response)

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    structuredContent: {
      content_type: response.output.content_type,
      sourceCount: response.output.sources.length,
      sources: response.output.sources.map((source) => ({
        url: source.url,
        title: source.title,
        snippetCount: source.snippets.length,
      })),
    },
  }
}
