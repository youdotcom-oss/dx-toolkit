import { describe, expect, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { TOOL_CONTRACT } from '../tools.ts'

const youSearchInputSchema = {
  additionalProperties: false,
  properties: {
    num_web_results: {
      minimum: 0,
      type: 'number',
    },
    query: {
      description: 'The search query to execute.',
      type: 'string',
    },
    safesearch: {
      enum: ['off', 'moderate', 'strict'],
      type: 'string',
    },
  },
  required: ['query'],
  type: 'object',
} as const

const youSearchOutputSchema = {
  additionalProperties: true,
  properties: {
    hits: {
      items: {
        additionalProperties: true,
        properties: {
          title: {
            type: 'string',
          },
          url: {
            type: 'string',
          },
        },
        required: ['title', 'url'],
        type: 'object',
      },
      type: 'array',
    },
  },
  required: ['hits'],
  type: 'object',
} as const

const assertNonEmptySearchResult = (value: unknown) => {
  expect(value).toBeDefined()

  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'object' && value !== null) {
    expect(Object.keys(value).length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'string') {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  throw new Error(`Unexpected search result type: ${typeof value}`)
}

describe('ydc tools', () => {
  test('prints the offline generated tool contract as JSON', async () => {
    const process = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'tools'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({
      contractHash: '602506b581cfeb48fcc0b27e8e1f0c070f957a2048e5f8632793da7de7e19028',
      surfaceVersion: '2026.05.14',
      tools: ['you-contents', 'you-finance', 'you-research', 'you-search'],
    })
  })
})

describe('tool contract invariants', () => {
  test('keeps tool ids sorted and unique', () => {
    const toolNames = TOOL_CONTRACT.tools.map(({ name }) => name)
    const sortedToolNames = [...toolNames].sort()

    expect(toolNames).toEqual(sortedToolNames)
    expect(new Set(toolNames).size).toBe(toolNames.length)
  })
})

describe('ydc help and command validation', () => {
  test('prints plain-text help for --help', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', '--help'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(stdout).toContain('Usage: ydc tools')
  })

  test('rejects unknown commands immediately', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-missing'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('Unknown command: you-missing')
  })
})

describe('ydc schema', () => {
  test('prints the full remote input schema for an allowlisted tool', async () => {
    const child = Bun.spawn({
      cmd: ['bun', '--preload', './src/tests/mcp-fetch.preload.ts', './src/cli.ts', 'schema', 'you-search'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: youSearchInputSchema,
            name: 'you-search',
            outputSchema: youSearchOutputSchema,
          },
        ]),
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual(youSearchInputSchema)
  })

  test('prints the remote output schema for an allowlisted tool', async () => {
    const child = Bun.spawn({
      cmd: ['bun', '--preload', './src/tests/mcp-fetch.preload.ts', './src/cli.ts', 'schema', 'you-search', 'output'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: youSearchInputSchema,
            name: 'you-search',
            outputSchema: youSearchOutputSchema,
          },
        ]),
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual(youSearchOutputSchema)
  })

  test('uses profile routing and strips auth for free search schema requests', async () => {
    const traceFile = `/private/tmp/${randomUUID()}.jsonl`
    const child = Bun.spawn({
      cmd: [
        'bun',
        '--preload',
        './src/tests/mcp-fetch.preload.ts',
        './src/cli.ts',
        'schema',
        'you-search',
        '--profile',
        'free',
        '--api-key',
        'secret-key',
      ],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: youSearchInputSchema,
            name: 'you-search',
            outputSchema: youSearchOutputSchema,
          },
        ]),
        YDC_TEST_MCP_TRACE_FILE: traceFile,
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    const trace = await readTrace(traceFile)

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual(youSearchInputSchema)
    expect(trace.length).toBeGreaterThan(0)
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?profile=free')).toBe(true)
    expect(trace.every(({ headers }) => !('authorization' in headers))).toBe(true)
  })
})

describe('ydc tool execution', () => {
  test('calls an allowlisted remote tool and prints the normalized JSON result', async () => {
    const child = Bun.spawn({
      cmd: [
        'bun',
        '--preload',
        './src/tests/mcp-fetch.preload.ts',
        './src/cli.ts',
        'you-search',
        '{"query":"DX Toolkit"}',
      ],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: {
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
              type: 'object',
            },
            name: 'you-search',
          },
        ]),
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({ ok: true })
  })

  test('prints sanitized dry-run details for a scoped tool call', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--dry-run', '--api-key', 'secret-key'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({
      arguments: {
        query: 'DX Toolkit',
      },
      headers: {
        Authorization: 'Bearer [REDACTED]',
      },
      tool: 'you-search',
      url: 'https://api.you.com/mcp?tools=you-search',
    })
  })

  test('reads JSON input from stdin when the positional JSON argument is omitted', async () => {
    const child = Bun.spawn({
      cmd: ['bun', '--preload', './src/tests/mcp-fetch.preload.ts', './src/cli.ts', 'you-search'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: {
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
              type: 'object',
            },
            name: 'you-search',
          },
        ]),
      },
      stderr: 'pipe',
      stdin: 'pipe',
      stdout: 'pipe',
    })

    child.stdin.write('{"query":"from stdin"}')
    child.stdin.end()

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({ ok: true })
  })

  test('uses profile routing and strips auth for free search dry-runs', async () => {
    const child = Bun.spawn({
      cmd: [
        'bun',
        './src/cli.ts',
        'you-search',
        '{"query":"DX Toolkit"}',
        '--profile',
        'free',
        '--api-key',
        'secret-key',
        '--dry-run',
      ],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({
      arguments: {
        query: 'DX Toolkit',
      },
      headers: {},
      tool: 'you-search',
      url: 'https://api.you.com/mcp?profile=free',
    })
  })

  test('rejects --profile for tools that do not support the free profile', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-research', '{"query":"DX Toolkit"}', '--profile', 'free'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('--profile is only supported for you-search')
  })

  test('executes you-search against the hosted MCP server', async () => {
    let stdout = ''
    let stderr = ''
    let exitCode = 1

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const child = Bun.spawn({
        cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"OpenAI"}', '--profile', 'free'],
        cwd: `${import.meta.dir}/../..`,
        stderr: 'pipe',
        stdout: 'pipe',
      })

      ;[stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ])

      if (exitCode === 0) {
        break
      }

      if (!stderr.includes('Unable to connect') && !stderr.includes('ConnectionRefused')) {
        break
      }

      await Bun.sleep(250)
    }

    if (stderr.includes('Unable to connect') || stderr.includes('ConnectionRefused')) {
      return
    }

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')

    assertNonEmptySearchResult(JSON.parse(stdout) as unknown)
  })
})

const readTrace = async (traceFile: string) => {
  const file = Bun.file(traceFile)

  if (!(await file.exists())) {
    return []
  }

  const content = await file.text()

  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { headers: Record<string, string>; method: string; url: string })
}
