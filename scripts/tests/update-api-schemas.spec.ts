import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderApiSchemas } from '../update-api-schemas.ts'

const basePayload = {
  'you-answer': {
    inputSchema: {
      properties: {},
      type: 'object',
    },
  },
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
  'you-discover': {
    inputSchema: {
      properties: {},
      type: 'object',
    },
  },
  'you-finance': {
    inputSchema: {
      properties: {},
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

describe('renderApiSchemas', () => {
  test('emits deterministic known tool schema snapshots and types', () => {
    const output = renderApiSchemas(basePayload)

    expect(output).toContain(`export const API_TOOL_SCHEMAS = {`)
    expect(output).toContain(`export type YouSearchInput = {`)
    expect(output).toContain(`query: string`)
    expect(output).toContain(`export type YouContentsInput = {`)
    expect(output).toContain(`urls: Array<string>`)
    expect(output).toContain(`export type KnownToolOutput<T extends KnownToolName> = KnownToolOutputMap[T]`)
  })
})

describe('api schema drift workflow', () => {
  test('uses the repository GitHub token for GitHub operations', () => {
    const workflow = readFileSync(
      resolve(import.meta.dir, '..', '..', '.github', 'workflows', 'api-schema-drift.yml'),
      'utf8',
    )

    expect(workflow).toContain('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}')
    expect(workflow).not.toContain('secrets.PUBLISH_TOKEN')
  })

  test('classifies SemVer drift with the dedicated classifier script', () => {
    const workflow = readFileSync(
      resolve(import.meta.dir, '..', '..', '.github', 'workflows', 'api-schema-drift.yml'),
      'utf8',
    )

    expect(workflow).toContain('bun scripts/classify-api-schema-change.ts')
    expect(workflow).toContain('bun scripts/update-api-schemas.ts')
  })
})
