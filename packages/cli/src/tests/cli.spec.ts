import { describe, expect, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
      contractHash: 'eb28a7ce9289045254f5b3ed78be8eec5b7caf25bec8457e5a47fae0b070f283',
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

  test('prints the same help for the -h short flag', async () => {
    const longChild = Bun.spawn({
      cmd: ['bun', './src/cli.ts', '--help'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })
    const shortChild = Bun.spawn({
      cmd: ['bun', './src/cli.ts', '-h'],
      cwd: `${import.meta.dir}/../..`,
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const [longOut, , longExit] = await Promise.all([
      new Response(longChild.stdout).text(),
      new Response(longChild.stderr).text(),
      longChild.exited,
    ])
    const [shortOut, shortErr, shortExit] = await Promise.all([
      new Response(shortChild.stdout).text(),
      new Response(shortChild.stderr).text(),
      shortChild.exited,
    ])

    expect(longExit).toBe(0)
    expect(shortExit).toBe(0)
    expect(shortErr).toBe('')
    expect(shortOut).toBe(longOut)
  })

  test('lists every allowlisted tool and flag in the help output', async () => {
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
    for (const { name } of TOOL_CONTRACT.tools) {
      expect(stdout).toContain(name)
    }
    expect(stdout).toContain('--api-key')
    expect(stdout).toContain('--dry-run')
    expect(stdout).toContain('--profile')
    expect(stdout).toContain('-h, --help')
  })

  test('prints help to stderr and exits non-zero when no command is given', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts'],
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
    expect(stderr).toContain('Usage: ydc tools')
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

  test('uses profile routing and sends auth for free search schema requests', async () => {
    const traceFile = join(tmpdir(), `${randomUUID()}.jsonl`)
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
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?profile=free&tools=you-search')).toBe(true)
    expect(trace.every(({ headers }) => headers.authorization === 'Bearer secret-key')).toBe(true)
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

  test('exits non-zero when a hosted tool returns an error result', async () => {
    const child = Bun.spawn({
      cmd: [
        'bun',
        '--preload',
        './src/tests/mcp-fetch.preload.ts',
        './src/cli.ts',
        'you-search',
        '{"query":"tool-error"}',
      ],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_API_KEY: '',
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: youSearchInputSchema,
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

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('returned an error')
  })

  test('exits non-zero when a hosted tool omits structured content', async () => {
    const child = Bun.spawn({
      cmd: [
        'bun',
        '--preload',
        './src/tests/mcp-fetch.preload.ts',
        './src/cli.ts',
        'you-search',
        '{"query":"missing-structured-content"}',
      ],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_API_KEY: '',
        YDC_TEST_MCP_TOOLS: JSON.stringify([
          {
            inputSchema: youSearchInputSchema,
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

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('did not return structured content')
  })

  test('rejects malformed JSON input with a plain error message', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"'],
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
    expect(stderr).toContain('Invalid JSON input for tool: you-search')
    expect(stderr).not.toContain('SyntaxError')
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

  test('uses YDC_ALLOWED_TOOLS for authenticated dry-runs when set', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--dry-run', '--api-key', 'secret-key'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_ALLOWED_TOOLS: 'you-search,you-finance',
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
      url: 'https://api.you.com/mcp?tools=you-search%2Cyou-finance',
    })
  })

  test('uses YDC_ALLOWED_TOOLS for dry-runs even without an api key', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--dry-run'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_API_KEY: '',
        YDC_ALLOWED_TOOLS: 'you-search,you-finance',
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
      url: 'https://api.you.com/mcp?tools=you-search%2Cyou-finance',
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

  test('uses profile routing and sends auth for free search dry-runs', async () => {
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
      headers: {
        Authorization: 'Bearer [REDACTED]',
      },
      tool: 'you-search',
      url: 'https://api.you.com/mcp?profile=free&tools=you-search',
    })
  })

  test('rejects --profile when the value is missing', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--profile'],
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
    expect(stderr).toContain('--profile')
  })

  test('rejects --api-key when the next token is another flag', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--api-key', '--dry-run'],
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
    expect(stderr).toContain('--api-key')
  })

  test('accepts --profile=value equals form', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--dry-run', '--profile=free'],
      cwd: `${import.meta.dir}/../..`,
      env: { ...process.env, YDC_API_KEY: '' },
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
    expect(JSON.parse(stdout).url).toBe('https://api.you.com/mcp?profile=free&tools=you-search')
  })

  test('accepts --api-key=value equals form', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--dry-run', '--api-key=secret-key'],
      cwd: `${import.meta.dir}/../..`,
      env: { ...process.env, YDC_API_KEY: '' },
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
    expect(JSON.parse(stdout).headers).toEqual({ Authorization: 'Bearer [REDACTED]' })
  })

  test('rejects unknown flags instead of silently ignoring them', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-search', '{"query":"DX Toolkit"}', '--bogus'],
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
    expect(stderr).toContain('--bogus')
  })

  test('passes --profile through to the server for any tool', async () => {
    const child = Bun.spawn({
      cmd: ['bun', './src/cli.ts', 'you-research', '{"query":"DX Toolkit"}', '--profile', 'thoughtspot', '--dry-run'],
      cwd: `${import.meta.dir}/../..`,
      env: {
        ...process.env,
        YDC_API_KEY: '',
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
      tool: 'you-research',
      url: 'https://api.you.com/mcp?profile=thoughtspot&tools=you-research',
    })
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
