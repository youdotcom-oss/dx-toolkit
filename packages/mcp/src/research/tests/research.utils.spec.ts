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

    expect(result).toHaveProperty('content')
    expect(result).toHaveProperty('structuredContent')
    expect(Array.isArray(result.content)).toBe(true)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')

    const text = result.content[0]?.text
    expect(text).toContain('Research Answer')
    expect(text).toContain('Source One')
    expect(text).toContain('https://example.com/source1')

    expect(result.structuredContent.contentType).toBe('text')
    expect(result.structuredContent.sourceCount).toBe(2)
    expect(result.structuredContent.sources).toHaveLength(2)
    expect(result.structuredContent.sources[0]).toMatchObject({
      url: 'https://example.com/source1',
      title: 'Source One',
      snippetCount: 2,
    })
    expect(result.structuredContent.sources[1]).toMatchObject({
      url: 'https://example.com/source2',
      title: 'Source Two',
      snippetCount: 1,
    })
  })

  test('handles source with undefined title', () => {
    const mockResponse: ResearchResponse = {
      output: {
        content: 'Answer text',
        content_type: 'text',
        sources: [
          {
            url: 'https://example.com/no-title',
            snippets: ['A snippet'],
          },
        ],
      },
    }

    const result = formatResearchResults(mockResponse)

    expect(result.structuredContent.sourceCount).toBe(1)
    expect(result.structuredContent.sources[0]).toMatchObject({
      url: 'https://example.com/no-title',
      title: undefined,
      snippetCount: 1,
    })
  })

  test('handles source with empty snippets array', () => {
    const mockResponse: ResearchResponse = {
      output: {
        content: 'Answer with no-snippet source',
        content_type: 'text',
        sources: [
          {
            url: 'https://example.com/empty-snippets',
            title: 'Empty Snippets Source',
            snippets: [],
          },
        ],
      },
    }

    const result = formatResearchResults(mockResponse)

    expect(result.structuredContent.sourceCount).toBe(1)
    expect(result.structuredContent.sources[0]?.snippetCount).toBe(0)
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

    expect(result.structuredContent.sourceCount).toBe(0)
    expect(result.structuredContent.sources).toHaveLength(0)
    expect(result.content[0]?.text).toContain('An answer with no cited sources.')
  })
})
