import { afterEach, describe, expect, mock, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { createBridge } from '../bridge.ts'

type MockTransport = {
  close: ReturnType<typeof mock<() => Promise<void>>>
  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void
  send: ReturnType<typeof mock<(message: JSONRPCMessage) => Promise<void>>>
}

const createMockTransport = (): MockTransport => ({
  close: mock(async () => {}),
  send: mock(async () => {}),
})

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const packageRoot = `${import.meta.dir}/../..`
const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
)

const assertNonEmptySearchResult = (value: unknown) => {
  expect(value).toBeDefined()

  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'object' && value !== null) {
    if ('isError' in value) {
      expect(value.isError).not.toBe(true)
    }

    if ('content' in value && Array.isArray(value.content)) {
      expect(value.content.length).toBeGreaterThan(0)
      return
    }

    expect(Object.keys(value).length).toBeGreaterThan(0)
    return
  }

  if (typeof value === 'string') {
    expect(value.length).toBeGreaterThan(0)
    return
  }

  throw new Error(`Unexpected search result type: ${typeof value}`)
}

describe('createBridge', () => {
  const originalExit = process.exit
  const originalStderrWrite = process.stderr.write

  const mockedExit = mock((() => undefined) as typeof process.exit)
  const mockedStderrWrite = mock((() => true) as typeof process.stderr.write)

  afterEach(() => {
    process.exit = originalExit
    process.stderr.write = originalStderrWrite
    mockedExit.mockClear()
    mockedStderrWrite.mockClear()
  })

  test('HTTP close closes both transports and exits 0', async () => {
    process.exit = mockedExit
    process.stderr.write = mockedStderrWrite

    const stdio = createMockTransport()
    const http = createMockTransport()

    createBridge(stdio, http)
    http.onclose?.()
    await flushMicrotasks()

    expect(stdio.close).toHaveBeenCalledTimes(1)
    expect(http.close).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledWith(0)
    expect(mockedStderrWrite).not.toHaveBeenCalled()
  })

  test('STDIO close closes both transports and exits 0', async () => {
    process.exit = mockedExit
    process.stderr.write = mockedStderrWrite

    const stdio = createMockTransport()
    const http = createMockTransport()

    createBridge(stdio, http)
    stdio.onclose?.()
    await flushMicrotasks()

    expect(stdio.close).toHaveBeenCalledTimes(1)
    expect(http.close).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledWith(0)
    expect(mockedStderrWrite).not.toHaveBeenCalled()
  })

  test('HTTP send failure exits 1', async () => {
    process.exit = mockedExit
    process.stderr.write = mockedStderrWrite

    const stdio = createMockTransport()
    const http = createMockTransport()
    http.send.mockRejectedValueOnce(new Error('HTTP send failed'))

    createBridge(stdio, http)
    stdio.onmessage?.({
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/list',
    })
    await flushMicrotasks()

    expect(stdio.close).toHaveBeenCalledTimes(1)
    expect(http.close).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledWith(1)
    expect(mockedStderrWrite).toHaveBeenCalledWith(expect.stringContaining('HTTP send error: Error: HTTP send failed'))
  })

  test('STDIO send failure exits 1', async () => {
    process.exit = mockedExit
    process.stderr.write = mockedStderrWrite

    const stdio = createMockTransport()
    const http = createMockTransport()
    stdio.send.mockRejectedValueOnce(new Error('STDIO send failed'))

    createBridge(stdio, http)
    http.onmessage?.({
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/list',
    })
    await flushMicrotasks()

    expect(stdio.close).toHaveBeenCalledTimes(1)
    expect(http.close).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledWith(1)
    expect(mockedStderrWrite).toHaveBeenCalledWith(
      expect.stringContaining('STDIO send error: Error: STDIO send failed'),
    )
  })

  test('closing guard prevents duplicate shutdown', async () => {
    process.exit = mockedExit
    process.stderr.write = mockedStderrWrite

    const stdio = createMockTransport()
    const http = createMockTransport()

    createBridge(stdio, http)
    http.onclose?.()
    stdio.onclose?.()
    http.onerror?.(new Error('late error'))
    await flushMicrotasks()

    expect(stdio.close).toHaveBeenCalledTimes(1)
    expect(http.close).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledTimes(1)
    expect(mockedExit).toHaveBeenCalledWith(0)
    expect(mockedStderrWrite).not.toHaveBeenCalled()
  })
})

describe('stdio bridge e2e', () => {
  let client: Client | undefined
  let transport: StdioClientTransport | undefined

  afterEach(async () => {
    await Promise.allSettled([client?.close(), transport?.close()])
  })

  test('executes you-search against the configured MCP route and forwards the scoped tools query', async () => {
    const traceFile = join(tmpdir(), `${randomUUID()}.jsonl`)

    transport = new StdioClientTransport({
      args: ['--preload', '../cli/src/tests/mcp-fetch.preload.ts', './src/stdio-bridge.ts'],
      command: 'bun',
      cwd: packageRoot,
      env: {
        ...inheritedEnv,
        YDC_ALLOWED_TOOLS: 'you-search',
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
        YDC_TEST_MCP_TRACE_FILE: traceFile,
      },
      stderr: 'pipe',
    })
    client = new Client({
      name: 'mcp-e2e-test',
      version: '1.0.0',
    })

    await client.connect(transport)

    const tools = await client.listTools()
    expect(tools.tools.some(({ name }) => name === 'you-search')).toBe(true)

    const result = await client.callTool({
      arguments: {
        query: 'OpenAI',
      },
      name: 'you-search',
    })

    assertNonEmptySearchResult(result)

    const trace = await readTrace(traceFile)
    expect(trace.length).toBeGreaterThan(0)
    expect(trace.every(({ url }) => url === 'https://api.you.com/mcp?tools=you-search')).toBe(true)
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
