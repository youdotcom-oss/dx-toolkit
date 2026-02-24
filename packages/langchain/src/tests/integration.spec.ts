import { beforeAll, describe, expect, test } from 'bun:test'
import type { BaseMessage } from '@langchain/core/messages'
import { createAgent, initChatModel } from 'langchain'
import { youContents, youSearch } from '../main.ts'

/**
 * Integration tests for LangChain Plugin
 *
 * Test Strategy:
 * - Smoke tests: Verify each tool wrapper executes and returns valid JSON strings
 * - Error handling: Wrapper-specific validation (API key checks)
 * - LangChain integration: Agent-based tests with tool binding
 *
 * Requirements:
 * - YDC_API_KEY: You.com API key
 * - ANTHROPIC_API_KEY: Anthropic API key (for LangChain agent tests)
 *
 * Note: The @youdotcom-oss/mcp package thoroughly tests the underlying
 * API utilities. These tests focus on the LangChain wrapper functionality
 * and integration, which is this package's primary value.
 */

/**
 * Validates that a string field contains real, non-trivial content
 */
const expectRealString = (value: unknown, minLength = 1, fieldName = 'field') => {
  expect(value, `${fieldName} should be defined`).toBeDefined()
  expect(typeof value, `${fieldName} should be a string`).toBe('string')
  expect((value as string).length, `${fieldName} should have content`).toBeGreaterThan(minLength)
  expect((value as string).trim(), `${fieldName} should not be whitespace only`).not.toBe('')
}

describe('Error Handling', () => {
  test('invalid API key format is handled with clear error', async () => {
    const searchTool = youSearch({ apiKey: 'invalid-key-format' })

    await expect(searchTool.invoke({ query: 'test' })).rejects.toThrow()
  })
})

describe('LangChain Plugin Integration Tests', () => {
  const apiKey = process.env.YDC_API_KEY

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('YDC_API_KEY environment variable is required for integration tests')
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests')
    }
  })

  describe('Smoke Tests', () => {
    test(
      'youSearch - basic tool invocation',
      async () => {
        const searchTool = youSearch({ apiKey })
        const raw = await searchTool.invoke({
          query: 'TypeScript best practices',
          count: 3,
        })

        expect(typeof raw).toBe('string')
        const result = JSON.parse(raw)

        expect(result.results).toBeDefined()
        expect(result.results.web).toBeDefined()
        expect(Array.isArray(result.results.web)).toBe(true)
        expect(result.results.web.length).toBeGreaterThan(0)

        const firstResult = result.results.web[0]
        expect(firstResult).toBeDefined()

        // Validate URL is real and well-formed
        expectRealString(firstResult.url, 10, 'url')
        expect(firstResult.url).toMatch(/^https?:\/\/.+/)

        // Validate title and description
        expectRealString(firstResult.title, 5, 'title')
        expectRealString(firstResult.description, 20, 'description')
      },
      { timeout: 30_000, retry: 2 },
    )

    test(
      'youContents - basic tool invocation',
      async () => {
        const contentsTool = youContents({ apiKey })
        const raw = await contentsTool.invoke({
          urls: ['https://documentation.you.com/developer-resources/mcp-server'],
          formats: ['markdown'],
        })

        expect(typeof raw).toBe('string')
        const result = JSON.parse(raw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)

        const firstItem = result[0]
        expect(firstItem).toBeDefined()
        expect(firstItem.url).toBe('https://documentation.you.com/developer-resources/mcp-server')

        // Validate markdown has substantial content
        expectRealString(firstItem.markdown, 100, 'markdown')
      },
      { timeout: 30_000, retry: 2 },
    )
  })

  describe('LangChain Agent Integration', () => {
    test(
      'single tool with agent',
      async () => {
        const model = await initChatModel('claude-haiku-4-5', {
          temperature: 0,
        })

        const agent = createAgent({
          model,
          tools: [youSearch({ apiKey })],
        })

        const result = await agent.invoke({
          messages: [{ role: 'user', content: 'Search for the latest developments in AI agents' }],
        })

        // Validate agent produced messages
        expect(result.messages).toBeDefined()
        expect(result.messages.length).toBeGreaterThan(1)

        // Find tool messages in the response
        const toolMessages = result.messages.filter((m: BaseMessage) => m._getType() === 'tool')
        expect(toolMessages.length).toBeGreaterThan(0)

        // Validate tool output exists
        const firstToolMessage = toolMessages[0]
        expect(firstToolMessage).toBeDefined()
        expect(firstToolMessage!.content).toBeDefined()
      },
      { timeout: 120_000, retry: 2 },
    )

    test(
      'multiple tools with agent',
      async () => {
        const model = await initChatModel('claude-haiku-4-5', {
          temperature: 0,
        })

        const agent = createAgent({
          model,
          tools: [youSearch({ apiKey }), youContents({ apiKey })],
        })

        const result = await agent.invoke({
          messages: [
            {
              role: 'user',
              content: 'Search for WebAssembly tutorials, then extract the content from the first result URL',
            },
          ],
        })

        // Validate agent produced messages
        expect(result.messages).toBeDefined()
        expect(result.messages.length).toBeGreaterThan(1)

        // Find tool messages
        const toolMessages = result.messages.filter((m: BaseMessage) => m._getType() === 'tool')
        expect(toolMessages.length).toBeGreaterThanOrEqual(1)

        // Get final AI response
        const aiMessages = result.messages.filter((m: BaseMessage) => m._getType() === 'ai')
        const lastAiMessage = aiMessages[aiMessages.length - 1]
        expect(lastAiMessage).toBeDefined()
        expect(typeof lastAiMessage!.content).toBe('string')
        expect((lastAiMessage!.content as string).length).toBeGreaterThan(50)
      },
      { timeout: 180_000, retry: 2 },
    )
  })
})
