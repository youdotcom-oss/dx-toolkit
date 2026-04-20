import type { ResearchResponse } from '@youdotcom-oss/api'
import { formatResearchResponse } from '@youdotcom-oss/api'

export const formatResearchResults = (response: ResearchResponse): Array<{ type: 'text'; text: string }> => {
  const text = formatResearchResponse(response)
  return [
    {
      type: 'text',
      text,
    },
  ]
}
