import { describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { classifySchemaChange, readCurrentPayload } from '../classify-api-schema-change.ts'

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

  test('keeps scanning after a minor tool change so later major changes win', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-contents': {
          inputSchema: {
            properties: {
              format: {
                type: 'string',
              },
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
          outputSchema: basePayload['you-contents'].outputSchema,
        },
        'you-research': {
          inputSchema: {
            properties: {
              input: {
                type: 'number',
              },
            },
            required: ['input'],
            type: 'object',
          },
          outputSchema: basePayload['you-research'].outputSchema,
        },
      }),
    ).toBe('major')
  })

  test('does not downgrade a nested major field change when an optional field is added', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            properties: {
              query: {
                type: 'number',
              },
              region: {
                type: 'string',
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

  test('classifies enum widening with a type change as major', () => {
    expect(
      classifySchemaChange(
        {
          ...basePayload,
          'you-search': {
            inputSchema: {
              properties: {
                query: {
                  enum: ['basic'],
                  type: 'string',
                },
              },
              required: ['query'],
              type: 'object',
            },
            outputSchema: basePayload['you-search'].outputSchema,
          },
        },
        {
          ...basePayload,
          'you-search': {
            inputSchema: {
              properties: {
                query: {
                  enum: ['basic', 'advanced'],
                },
              },
              required: ['query'],
              type: 'object',
            },
            outputSchema: basePayload['you-search'].outputSchema,
          },
        },
      ),
    ).toBe('major')
  })

  test('classifies input additionalProperties tightening as major', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-search': {
          inputSchema: {
            additionalProperties: false,
            properties: {
              query: {
                type: 'string',
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

  test('treats duplicate enum values as patch when the enum set is unchanged', () => {
    expect(
      classifySchemaChange(
        {
          ...basePayload,
          'you-search': {
            inputSchema: {
              properties: {
                query: {
                  enum: ['basic', 'advanced'],
                  type: 'string',
                },
              },
              required: ['query'],
              type: 'object',
            },
            outputSchema: basePayload['you-search'].outputSchema,
          },
        },
        {
          ...basePayload,
          'you-search': {
            inputSchema: {
              properties: {
                query: {
                  enum: ['basic', 'advanced', 'advanced'],
                  type: 'string',
                },
              },
              required: ['query'],
              type: 'object',
            },
            outputSchema: basePayload['you-search'].outputSchema,
          },
        },
      ),
    ).toBe('patch')
  })

  test('classifies output required fields becoming optional as major', () => {
    expect(
      classifySchemaChange(basePayload, {
        ...basePayload,
        'you-contents': {
          inputSchema: basePayload['you-contents'].inputSchema,
          outputSchema: {
            properties: {
              output: {
                items: {
                  type: 'object',
                },
                type: 'array',
              },
            },
            required: [],
            type: 'object',
          },
        },
      }),
    ).toBe('major')
  })

  test('classifies output additionalProperties schema removal as major', () => {
    expect(
      classifySchemaChange(
        {
          ...basePayload,
          'you-search': {
            inputSchema: basePayload['you-search'].inputSchema,
            outputSchema: {
              additionalProperties: {
                type: 'string',
              },
              properties: {
                results: {
                  type: 'object',
                },
              },
              type: 'object',
            },
          },
        },
        {
          ...basePayload,
          'you-search': {
            inputSchema: basePayload['you-search'].inputSchema,
            outputSchema: basePayload['you-search'].outputSchema,
          },
        },
      ),
    ).toBe('major')
  })
})

describe('readCurrentPayload', () => {
  test('does not execute code while reading generated schemas', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'api-schema-parser-'))
    const schemaPath = join(tempDir, 'tool-schemas.ts')
    const globalWithFlag = globalThis as typeof globalThis & { __schemaParserExecuted?: boolean }

    try {
      delete globalWithFlag.__schemaParserExecuted
      await Bun.write(
        schemaPath,
        `export const API_TOOL_SCHEMAS = (() => { globalThis.__schemaParserExecuted = true; return {} })() as const\n`,
      )

      expect(readCurrentPayload(schemaPath)).toBeUndefined()
      expect(globalWithFlag.__schemaParserExecuted).toBeUndefined()
    } finally {
      delete globalWithFlag.__schemaParserExecuted
      rmSync(tempDir, { force: true, recursive: true })
    }
  })
})
