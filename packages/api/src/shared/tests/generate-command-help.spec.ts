import { describe, expect, test } from 'bun:test'
import { generateCommandHelp } from '../generate-command-help.ts'

describe('generateCommandHelp', () => {
  test('formats required and optional fields', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          query: { type: 'string', description: 'Search query' },
          count: { type: 'integer', description: 'Number of results' },
        },
        required: ['query'],
      },
      commandName: 'search',
    })

    expect(result).toContain('query*')
    expect(result).toContain('string')
    expect(result).toContain('Search query')
    expect(result).not.toContain('count*')
    expect(result).toContain('count')
    expect(result).toContain('integer')
    expect(result).toContain('* = required')
  })

  test('displays enum values', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          safesearch: { type: 'string', enum: ['off', 'moderate', 'strict'], description: 'Filter level' },
        },
      },
      commandName: 'search',
    })

    expect(result).toContain('off | moderate | strict')
    expect(result).toContain('Filter level')
  })

  test('displays range constraints', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          count: { type: 'integer', minimum: 1, maximum: 100, description: 'Results per page' },
        },
      },
      commandName: 'search',
    })

    expect(result).toContain('1-100')
    expect(result).toContain('Results per page')
  })

  test('displays default values', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          count: { type: 'integer', default: 10, description: 'Results per page' },
        },
      },
      commandName: 'search',
    })

    expect(result).toContain('default: 10')
  })

  test('displays command name and description', () => {
    const result = generateCommandHelp({
      jsonSchema: { properties: {} },
      commandName: 'search',
      description: 'Search the web with You.com',
    })

    expect(result).toContain('ydc search')
    expect(result).toContain('Search the web with You.com')
  })

  test('formats array types with item enums', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['markdown', 'html', 'metadata'] },
            description: 'Output formats',
          },
        },
      },
      commandName: 'contents',
    })

    expect(result).toContain('(markdown | html | metadata)[]')
  })

  test('handles minimum-only and maximum-only constraints', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          minOnly: { type: 'integer', minimum: 0, description: 'Min only' },
          maxOnly: { type: 'integer', maximum: 100, description: 'Max only' },
        },
      },
      commandName: 'test',
    })

    expect(result).toContain('>=0')
    expect(result).toContain('<=100')
  })

  test('truncates long enum lists', () => {
    const result = generateCommandHelp({
      jsonSchema: {
        properties: {
          country: {
            type: 'string',
            enum: ['AR', 'AU', 'AT', 'BE', 'BR', 'CA', 'CL', 'DK', 'FI', 'FR'],
            description: 'Country code',
          },
        },
      },
      commandName: 'search',
    })

    expect(result).toContain('AR | AU | AT ...+7 more')
    expect(result).not.toContain('BE')
  })

  test('handles empty properties', () => {
    const result = generateCommandHelp({
      jsonSchema: {},
      commandName: 'empty',
    })

    expect(result).toContain('ydc empty')
    expect(result).toContain('Input Parameters (JSON):')
  })
})
