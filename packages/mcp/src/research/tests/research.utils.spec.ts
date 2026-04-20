import { describe, expect, test } from 'bun:test'
import type { ResearchResponse } from '@youdotcom-oss/api'
import { formatResearchResults } from '../research.utils.ts'

describe('formatResearchResults', () => {
  test('formats research response with sources correctly', () => {
    const mockResponse: ResearchResponse = {
      output: {
        content: '# Research Answer\n\nThis is a comprehensive answer about the topic.',
        content_type: 'text',
        sources: [
          {
            url: 'https://example.com/source1',
            title: 'Source One',
            snippets: ['First snippet', 'Second snippet'],
          },
          {
            url: 'https://example.com/source2',
            title: 'Source Two',
            snippets: ['Another snippet'],
          },
        ],
      },
    }

    const result = formatResearchResults(mockResponse)

    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('type', 'text')
    expect(result[0]).toHaveProperty('text')

    const text = result[0]?.text
    expect(text).toContain('Research Answer')
    expect(text).toContain('Source One')
    expect(text).toContain('https://example.com/source1')
  })

  test('handles response with zero sources', () => {
    const mockResponse: ResearchResponse = {
      output: {
        content: 'An answer with no cited sources.',
        content_type: 'text',
        sources: [],
      },
    }

    const result = formatResearchResults(mockResponse)

    expect(result[0]?.text).toContain('An answer with no cited sources.')
  })
})
