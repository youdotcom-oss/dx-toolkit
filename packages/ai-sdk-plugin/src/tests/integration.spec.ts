import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText, stepCountIs, streamText } from 'ai'
import { youContents, youSearch } from '../main.ts'

/**
 * Integration tests for AI SDK Plugin
 *
 * Test Strategy:
 * - Smoke tests: Verify each tool wrapper executes without errors
 * - Error handling: Wrapper-specific validation (API key checks)
 * - AI SDK integration: Comprehensive tests of actual usage patterns
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key
 * - ANTHROPIC_API_KEY: Anthropic API key (for AI SDK integration tests)
 *
 * Note: The @youdotcom-oss/mcp package thoroughly tests the underlying
 * API utilities. These tests focus on the AI SDK wrapper functionality
 * and integration, which is this package's primary value.
 */

/**
 * Type helper to narrow execute result to non-async type
 */
const getExecuteResult = <T>(result: T | AsyncIterable<T> | undefined): T => {
  if (!result || typeof result === 'symbol' || Symbol.asyncIterator in Object(result)) {
    throw new Error('Invalid result type')
  }
  return result as T
}

/**
 * Validates that a string field contains real, non-trivial content
 * @param value - The value to validate
 * @param minLength - Minimum length requirement (default: 1)
 * @param fieldName - Field name for error messages (default: 'field')
 */
const expectRealString = (value: unknown, minLength = 1, fieldName = 'field') => {
  expect(value, `${fieldName} should be defined`).toBeDefined()
  expect(typeof value, `${fieldName} should be a string`).toBe('string')
  expect((value as string).length, `${fieldName} should have content`).toBeGreaterThan(minLength)
  expect((value as string).trim(), `${fieldName} should not be whitespace only`).not.toBe('')
}

describe('AI SDK Plugin Integration Tests', () => {
  const apiKey = process.env.YDC_API_KEY
  let originalSiteUrl: string | undefined

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests')
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests')
    }

    // Set test environment variable
    originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'TEST'
  })

  afterAll(() => {
    // Restore original value
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
  })

  describe('Smoke Tests', () => {
    test(
      'youSearch - basic wrapper execution',
      async () => {
        const searchTool = youSearch({ apiKey })
        const executeResult = await searchTool.execute?.(
          {
            query: 'TypeScript best practices',
            count: 3,
          },
          { toolCallId: 'test', messages: [] },
        )

        // Validate wrapper returns raw API response
        const result = getExecuteResult(executeResult) as any
        expect(result.results).toBeDefined()
        expect(result.results.web).toBeDefined()
        expect(Array.isArray(result.results.web)).toBe(true)
        expect(result.results.web.length).toBeGreaterThan(0)

        const firstResult = result.results.web[0]
        expect(firstResult).toBeDefined()

        // Validate URL is real and well-formed
        expectRealString(firstResult.url, 10, 'url')
        expect(firstResult.url).toMatch(/^https?:\/\/.+/)

        // Validate title has meaningful content
        expectRealString(firstResult.title, 5, 'title')

        // Validate description has meaningful content
        expectRealString(firstResult.description, 20, 'description')

        // Verify content relevance to query
        const combinedText = `${firstResult.title} ${firstResult.description}`.toLowerCase()
        expect(combinedText).toMatch(/typescript|javascript|js|best practice|programming|code/)
      },
      { timeout: 30_000, retry: 2 },
    )

    test(
      'youContents - basic wrapper execution',
      async () => {
        const contentsTool = youContents({ apiKey })
        const executeResult = await contentsTool.execute?.(
          {
            urls: ['https://documentation.you.com/developer-resources/mcp-server'],
            format: 'markdown',
          },
          { toolCallId: 'test', messages: [] },
        )

        // Validate wrapper returns raw API response
        const result = getExecuteResult(executeResult) as any
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)

        const firstItem = result[0]
        expect(firstItem).toBeDefined()

        // Validate URL matches request
        expect(firstItem.url).toBe('https://documentation.you.com/developer-resources/mcp-server')

        // Validate markdown has substantial content
        expectRealString(firstItem.markdown, 100, 'markdown')

        // Verify content structure (real markdown content)
        expect(firstItem.markdown).toMatch(/[a-zA-Z]{3,}/) // Contains actual words
        expect(firstItem.markdown.split('\n').length).toBeGreaterThan(5) // Multiple lines

        // Verify content relevance to known MCP server documentation
        const markdownLower = firstItem.markdown.toLowerCase()
        expect(markdownLower).toMatch(/mcp|model context protocol|server|tool/)
      },
      { timeout: 30_000, retry: 2 },
    )
  })

  describe('Error Handling', () => {
    test('missing API key throws error during execution', async () => {
      const searchTool = youSearch({ apiKey: '' })

      await expect(async () => {
        await searchTool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] })
      }).toThrow(/YDC_API_KEY is required/)
    })

    test('invalid API key format is handled with clear error', async () => {
      const searchTool = youSearch({ apiKey: 'invalid-key-format' })

      await expect(async () => {
        await searchTool.execute?.({ query: 'test' }, { toolCallId: 'test', messages: [] })
      }).toThrow()
    })
  })

  describe('AI SDK Integration', () => {
    const anthropic = createAnthropic()

    test(
      'single tool with generateText',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
          },
          prompt: 'Search for the latest developments in AI agents',
        })

        // Validate tool execution
        expect(result.toolCalls).toBeDefined()
        expect(result.toolCalls.length).toBeGreaterThan(0)
        expect(result.toolCalls[0]?.toolName).toBe('search')

        // Validate tool results contain raw API response
        expect(result.toolResults).toBeDefined()
        expect(result.toolResults.length).toBeGreaterThan(0)

        // Extract tool result from steps
        const toolResult = result.steps?.[0]?.content?.find((c: any) => c.type === 'tool-result') as any
        expect(toolResult).toBeDefined()
        expect(toolResult?.output).toBeDefined()

        // Validate raw API response structure
        const output = toolResult?.output as any
        expect(output.results).toBeDefined()
        expect(output.results.web).toBeDefined()
        expect(Array.isArray(output.results.web)).toBe(true)
        expect(output.results.web.length).toBeGreaterThan(0)

        const firstResult = output.results.web[0]
        expect(firstResult).toBeDefined()

        // Validate URL is real and well-formed
        expectRealString(firstResult.url, 10, 'url')
        expect(firstResult.url).toMatch(/^https?:\/\/.+/)

        // Validate title has meaningful content
        expectRealString(firstResult.title, 10, 'title')

        // Validate description has meaningful content
        expectRealString(firstResult.description, 30, 'description')

        // Verify content relevance to query
        const content = `${firstResult.title} ${firstResult.description}`.toLowerCase()
        expect(content).toMatch(/ai|agent|artificial intelligence|machine learning|llm|model/)
      },
      { timeout: 120_000, retry: 2 },
    )

    test(
      'multiple tools with generateText',
      async () => {
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
            extract: youContents({ apiKey }),
          },
          prompt: 'Search for WebAssembly tutorials on MDN, then extract the content from the top result URL',
        })

        // Validate that at least one step occurred
        expect(result.steps.length).toBeGreaterThanOrEqual(1)

        // Collect all tool calls across all steps
        const allToolCalls: any[] = []
        for (const step of result.steps) {
          const toolCallContent = step?.content?.filter((item: any) => item.type === 'tool-call') ?? []
          allToolCalls.push(...toolCallContent)
        }

        // Get unique tool names
        const toolNames = new Set(allToolCalls.map((item: any) => item.toolName))

        // Validate at least one tool was used
        expect(toolNames.size).toBeGreaterThanOrEqual(1)

        // Check which tools were called - expect search at minimum, extract is optional
        expect(toolNames.has('search') || toolNames.has('extract')).toBe(true)

        // Validate the final text response has content
        expectRealString(result.text, 50, 'final response text')
        const responseText = result.text.toLowerCase()
        expect(responseText).toMatch(/webassembly|wasm|tutorial|mdn/i)
      },
      { timeout: 180_000, retry: 2 },
    )

    test(
      'tools work with streamText',
      async () => {
        const { textStream } = streamText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey }),
          },
          stopWhen: stepCountIs(3),
          prompt: 'Search for cookie recipes and then invent a pepermint cookie recipe',
        })

        // Collect all chunks
        const chunks: string[] = []
        for await (const chunk of textStream) {
          chunks.push(chunk)
        }

        // Validate streaming produced content
        expect(chunks.length).toBeGreaterThan(5)
        const fullText = chunks.join('')
        expect(fullText.length).toBeGreaterThan(5)
      },
      { timeout: 120_000, retry: 2 },
    )

    test(
      'tool errors are handled gracefully in AI context',
      async () => {
        // Use invalid API key - should fail but not crash generateText
        const result = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          tools: {
            search: youSearch({ apiKey: 'invalid-key' }),
          },
          prompt: 'Search for TypeScript',
        })

        // The AI should still respond, possibly indicating tool failure
        expect(result.text).toBeDefined()
        expect(result.toolCalls).toBeDefined()
      },
      { timeout: 60_000, retry: 2 },
    )
  })
})
