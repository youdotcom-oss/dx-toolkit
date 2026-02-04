import { describe, expect, test } from 'bun:test'
import { ExpressAgentInputSchema } from '../express.schemas.ts'

describe('ExpressAgentInputSchema OpenAPI validation', () => {
  test('accepts valid express agent inputs', () => {
    const validInputs = [
      { input: 'What is AI?' },
      { input: 'Search for news', tools: [{ type: 'web_search' }] },
      { input: 'Tell me about quantum computing' },
    ]

    for (const validInput of validInputs) {
      expect(() => ExpressAgentInputSchema.parse(validInput)).not.toThrow()
    }
  })

  test('rejects invalid express agent inputs', () => {
    const invalidInputs = [
      {}, // Missing input
      { input: '' }, // Empty input
      { input: 'test', tools: [{ type: 'invalid_tool' }] }, // Invalid tool type
    ]

    for (const invalidInput of invalidInputs) {
      expect(() => ExpressAgentInputSchema.parse(invalidInput)).toThrow()
    }
  })

  test('accepts web_search tool', () => {
    const input = {
      input: 'Search for AI',
      tools: [{ type: 'web_search' }],
    }

    expect(() => ExpressAgentInputSchema.parse(input)).not.toThrow()
  })

  test('tools array is optional', () => {
    const inputWithoutTools = { input: 'Simple question' }
    const inputWithTools = { input: 'Search question', tools: [{ type: 'web_search' }] }

    expect(() => ExpressAgentInputSchema.parse(inputWithoutTools)).not.toThrow()
    expect(() => ExpressAgentInputSchema.parse(inputWithTools)).not.toThrow()
  })

  test('input must be non-empty string', () => {
    const validInputs = ['a', 'What is AI?', 'A very long question about many topics']

    for (const input of validInputs) {
      expect(() => ExpressAgentInputSchema.parse({ input })).not.toThrow()
    }

    // Empty string is rejected
    expect(() => ExpressAgentInputSchema.parse({ input: '' })).toThrow()
  })
})
