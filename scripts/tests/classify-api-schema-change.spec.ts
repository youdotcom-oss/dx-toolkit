import { describe, expect, test } from 'bun:test'
import { classifySchemaChange } from '../classify-api-schema-change.ts'

const basePayload = {
  'you-contents': {
    inputSchema: {
      properties: {
        urls: {
          items: {
            type: 'string',
          },
          type: 'array',
        },
      },
      required: ['urls'],
      type: 'object',
    },
    outputSchema: {
      properties: {
        output: {
          items: {
            type: 'object',
          },
          type: 'array',
        },
      },
      required: ['output'],
      type: 'object',
    },
  },
  'you-research': {
    inputSchema: {
      properties: {
        input: {
          type: 'string',
        },
      },
      required: ['input'],
      type: 'object',
    },
    outputSchema: {
      properties: {
        output: {
          type: 'object',
        },
      },
      type: 'object',
    },
  },
  'you-search': {
    inputSchema: {
      properties: {
        query: {
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
    outputSchema: {
      properties: {
        results: {
          type: 'object',
        },
      },
      type: 'object',
    },
  },
} as const

describe('classifySchemaChange', () => {
  test('classifies added optional input fields as minor and required input fields as major', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {
              query: {
                type: 'string',
              },
              safesearch: {
                type: 'string',
              },
            },
            required: ['query'],
            type: 'object',
          },
          outputSchema: basePayload['you-search'].outputSchema,
        },
      }),
    ).toBe('minor')

    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {
              query: {
                type: 'string',
              },
              required_new_field: {
                type: 'string',
              },
            },
            required: ['query', 'required_new_field'],
            type: 'object',
          },
          outputSchema: basePayload['you-search'].outputSchema,
        },
      }),
    ).toBe('major')
  })

  test('classifies removed fields and changed field types as major for TypeScript consumers', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {},
            required: [],
            type: 'object',
          },
          outputSchema: basePayload['you-search'].outputSchema,
        },
      }),
    ).toBe('major')

    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: basePayload['you-search'].inputSchema,
          outputSchema: {
            properties: {},
            type: 'object',
          },
        },
      }),
    ).toBe('major')

    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {
              query: {
                type: 'number',
              },
            },
            required: ['query'],
            type: 'object',
          },
          outputSchema: basePayload['you-search'].outputSchema,
        },
      }),
    ).toBe('major')
  })

  test('classifies added output fields as minor and metadata-only edits as patch', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: basePayload['you-search'].inputSchema,
          outputSchema: {
            properties: {
              metadata: {
                type: 'object',
              },
              results: {
                type: 'object',
              },
            },
            type: 'object',
          },
        },
      }),
    ).toBe('minor')

    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {
              query: {
                description: 'Updated description',
                type: 'string',
              },
            },
            required: ['query'],
            type: 'object',
          },
          outputSchema: basePayload['you-search'].outputSchema,
        },
      }),
    ).toBe('patch')
  })
})
