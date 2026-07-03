import { describe, expect, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { COMMAND_TOOL_MAP } from '../commands.ts'
import { TOOL_CONTRACT } from '../tools.ts'

const cwd = `${import.meta.dir}/../..`

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

type RunOptions = {
  args: string[]
  env?: Record<string, string>
  preload?: boolean
  stdin?: string
}

const run = async ({ args, env, preload, stdin }: RunOptions) => {
  const cmd = ['bun']

  if (preload) {
    cmd.push('--preload', './src/tests/mcp-fetch.preload.ts')
  }

  cmd.push('./src/cli.ts', ...args)

  const child = Bun.spawn({
    cmd,
    cwd,
    env: env ? { ...process.env, ...env } : undefined,
    stderr: 'pipe',
    stdin: stdin === undefined ? undefined : 'pipe',
    stdout: 'pipe',
  })

  if (stdin !== undefined) {
    child.stdin.write(stdin)
    child.stdin.end()
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])

  return { exitCode, stderr, stdout }
}

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

const mockedToolsEnv = (tools: unknown[], extra: Record<string, string> = {}) => ({
  ...extra,
  YDC_TEST_MCP_TOOLS: JSON.stringify(tools),
})

describe('ydc tools', () => {
  test('prints the offline contract plus command map as JSON', async () => {
    const { stdout, stderr, exitCode } = await run({ args: ['tools'] })

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({
      commands: {
        fetch: 'you-contents',
        'finance-research': 'you-finance',
        research: 'you-research',
        search: 'you-search',
      },
      contractHash: TOOL_CONTRACT.contractHash,
      surfaceVersion: TOOL_CONTRACT.surfaceVersion,
      tools: ['you-contents', 'you-finance', 'you-research', 'you-search'],
    })
  })

  test('pretty-prints when --pretty is passed', async () => {
    const { stdout, exitCode } = await run({ args: ['tools', '--pretty'] })

    expect(exitCode).toBe(0)
    expect(stdout).toContain('\n  "tools"')
  })
})

describe('tool contract invariants', () => {
  test('keeps tool ids sorted and unique', () => {
    const toolNames = TOOL_CONTRACT.tools.map(({ name }) => name)
    const sortedToolNames = [...toolNames].sort()

    expect(toolNames).toEqual(sortedToolNames)
    expect(new Set(toolNames).size).toBe(toolNames.length)
  })

  test('every primary command maps to an existing tool', () => {
    const toolNames = new Set(TOOL_CONTRACT.tools.map(({ name }) => name))

    for (const tool of Object.values(COMMAND_TOOL_MAP)) {
      expect(toolNames.has(tool)).toBe(true)
    }
  })
})

describe('ydc help, version, and command validation', () => {
  test('prints top-level help for --help', async () => {
    const { stdout, stderr, exitCode } = await run({ args: ['--help'] })

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(stdout).toContain('Primary commands:')
    expect(stdout).toContain('search <query>')
    expect(stdout).toContain('finance-research <input>')
  })

  test('prints per-command help with --help', async () => {
    const { stdout, exitCode } = await run({ args: ['search', '--help'] })

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Usage: ydc search <query>')
    expect(stdout).toContain('--include-domains')
  })

  test('prints version for --version', async () => {
    const { stdout, exitCode } = await run({ args: ['--version'] })

    expect(exitCode).toBe(0)
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/u)
  })

  test('rejects unknown commands immediately', async () => {
    const { stdout, stderr, exitCode } = await run({ args: ['you-missing'] })

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('Unknown command: you-missing')
  })
})

describe('ydc search', () => {
  test('prints sanitized dry-run details with input flags converted to snake_case', async () => {
    const { stdout, stderr, exitCode } = await run({
      args: [
        'search',
        'DX Toolkit',
        '--count',
        '5',
        '--include-domains',
        'nytimes.com,wsj.com',
        '--dry-run',
        '--api-key',
        'secret-key',
      ],
    })

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({
      arguments: {
        count: 5,
        include_domains: ['nytimes.com', 'wsj.com'],
        query: 'DX Toolkit',
      },
      headers: {
        Authorization: 'Bearer [REDACTED]',
      },
      tool: 'you-search',
      url: 'https://api.you.com/mcp?tools=you-search',
    })
  })

  test('uses profile routing and strips auth for free search dry-runs', async () => {
    const { stdout, exitCode } = await run({
      args: ['search', 'DX Toolkit', '--profile', 'free', '--api-key', 'secret-key', '--dry-run'],
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      arguments: { query: 'DX Toolkit' },
      headers: {},
      tool: 'you-search',
      url: 'https://api.you.com/mcp?profile=free',
    })
  })

  test('reads query from stdin when no positional is given', async () => {
    const { stdout, exitCode } = await run({
      args: ['search', '--dry-run', '--api-key', 'k'],
      stdin: 'from stdin',
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).arguments).toEqual({ query: 'from stdin' })
  })

  test('errors when no query is provided and stdin is empty', async () => {
    const { stderr, exitCode } = await run({
      args: ['search'],
      stdin: '',
    })

    expect(exitCode).toBe(1)
    expect(stderr).toContain('Missing query for search')
  })

  test('rejects --profile values other than free', async () => {
    const { stderr, exitCode } = await run({
      args: ['search', 'q', '--profile', 'pro'],
    })

    expect(exitCode).toBe(1)
    expect(stderr).toContain('--profile only supports "free"')
  })
})

describe('ydc fetch', () => {
  test('builds dry-run input from positional URLs', async () => {
    const { stdout, exitCode } = await run({
      args: [
        'fetch',
        'https://example.com',
        'https://other.com',
        '--formats',
        'markdown,metadata',
        '--dry-run',
        '--api-key',
        'k',
      ],
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      arguments: {
        formats: ['markdown', 'metadata'],
        urls: ['https://example.com', 'https://other.com'],
      },
      headers: { Authorization: 'Bearer [REDACTED]' },
      tool: 'you-contents',
      url: 'https://api.you.com/mcp?tools=you-contents',
    })
  })

  test('reads whitespace-separated URLs from stdin', async () => {
    const { stdout, exitCode } = await run({
      args: ['fetch', '--dry-run', '--api-key', 'k'],
      stdin: 'https://example.com\nhttps://other.com\n',
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).arguments).toEqual({
      urls: ['https://example.com', 'https://other.com'],
    })
  })

  test('errors when no URLs are provided', async () => {
    const { stderr, exitCode } = await run({
      args: ['fetch'],
      stdin: '',
    })

    expect(exitCode).toBe(1)
    expect(stderr).toContain('Missing URL(s) for fetch')
  })
})

describe('ydc research and finance-research', () => {
  test('research dry-run maps --effort to research_effort and routes via you-research', async () => {
    const { stdout, exitCode } = await run({
      args: ['research', 'compare warehouses', '--effort', 'deep', '--dry-run', '--api-key', 'k'],
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      arguments: { input: 'compare warehouses', research_effort: 'deep' },
      headers: { Authorization: 'Bearer [REDACTED]' },
      tool: 'you-research',
      url: 'https://api.you.com/mcp?tools=you-research',
    })
  })

  test('finance-research routes via you-finance', async () => {
    const { stdout, exitCode } = await run({
      args: ['finance-research', 'AAPL FY24', '--effort', 'exhaustive', '--dry-run', '--api-key', 'k'],
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      arguments: { input: 'AAPL FY24', research_effort: 'exhaustive' },
      headers: { Authorization: 'Bearer [REDACTED]' },
      tool: 'you-finance',
      url: 'https://api.you.com/mcp?tools=you-finance',
    })
  })
})

describe('ydc raw', () => {
  test('forwards raw JSON arguments to the requested tool', async () => {
    const { stdout, exitCode } = await run({
      args: ['raw', 'you-search', '{"query":"hi"}', '--dry-run', '--api-key', 'k'],
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      arguments: { query: 'hi' },
      headers: { Authorization: 'Bearer [REDACTED]' },
      tool: 'you-search',
      url: 'https://api.you.com/mcp?tools=you-search',
    })
  })

  test('reads JSON from stdin when the positional is omitted', async () => {
    const { stdout, exitCode } = await run({
      args: ['raw', 'you-search', '--dry-run', '--api-key', 'k'],
      stdin: '{"query":"from stdin"}',
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).arguments).toEqual({ query: 'from stdin' })
  })

  test('rejects --profile for tools that do not support free profile', async () => {
    const { stderr, exitCode } = await run({
      args: ['raw', 'you-research', '{"input":"x"}', '--profile', 'free'],
    })

    expect(exitCode).toBe(1)
    expect(stderr).toContain('--profile is not supported')
  })

  test('rejects unknown tools', async () => {
    const { stderr, exitCode } = await run({
      args: ['raw', 'you-missing', '{}'],
    })

    expect(exitCode).toBe(1)
    expect(stderr).toContain('Unknown tool: you-missing')
  })

  test('rejects invalid JSON without leaking SyntaxError', async () => {
    const { stdout, stderr, exitCode } = await run({
      args: ['raw', 'you-search', '{"query":"DX Toolkit"'],
    })

    expect(exitCode).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toContain('Invalid JSON input for tool: you-search')
    expect(stderr).not.toContain('SyntaxError')
  })
})

describe('ydc schema', () => {
  test('prints the full remote input schema for an allowlisted tool', async () => {
    const { stdout, stderr, exitCode } = await run({
      args: ['schema', 'you-search'],
      env: mockedToolsEnv([
        {
          inputSchema: youSearchInputSchema,
          name: 'you-search',
          outputSchema: youSearchOutputSchema,
        },
      ]),
      preload: true,
    })

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual(youSearchInputSchema)
  })

  test('prints the remote output schema when output is requested', async () => {
    const { stdout, exitCode } = await run({
      args: ['schema', 'you-search', 'output'],
      env: mockedToolsEnv([
        {
          inputSchema: youSearchInputSchema,
          name: 'you-search',
          outputSchema: youSearchOutputSchema,
        },
      ]),
      preload: true,
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout)).toEqual(youSearchOutputSchema)
  })

  test('uses profile routing and strips auth for free search schema requests', async () => {
    const traceFile = join(tmpdir(), `${randomUUID()}.jsonl`)
    const { stdout, stderr, exitCode } = await run({
      args: ['schema', 'you-search', '--profile', 'free', '--api-key', 'secret-key'],
      env: mockedToolsEnv(
        [
          {
            inputSchema: youSearchInputSchema,
            name: 'you-search',
            outputSchema: youSearchOutputSchema,
          },
        ],
        { YDC_TEST_MCP_TRACE_FILE: traceFile },
      ),
      preload: true,
    })
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
  test('search executes against the mocked MCP server and prints normalized JSON', async () => {
    const { stdout, stderr, exitCode } = await run({
      args: ['search', 'DX Toolkit', '--api-key', 'k'],
      env: mockedToolsEnv([
        {
          inputSchema: {
            properties: { query: { type: 'string' } },
            required: ['query'],
            type: 'object',
          },
          name: 'you-search',
        },
      ]),
      preload: true,
    })

    expect(exitCode).toBe(0)
    expect(stderr).toBe('')
    expect(JSON.parse(stdout)).toEqual({ ok: true })
  })

  test('search executes live against the hosted MCP server with the free profile', async () => {
    let stdout = ''
    let stderr = ''
    let exitCode = 1

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await run({
        args: ['search', 'OpenAI', '--profile', 'free'],
      })

      stdout = result.stdout
      stderr = result.stderr
      exitCode = result.exitCode

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
