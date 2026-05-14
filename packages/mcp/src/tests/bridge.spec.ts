import { afterEach, describe, expect, mock, test } from 'bun:test'
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
