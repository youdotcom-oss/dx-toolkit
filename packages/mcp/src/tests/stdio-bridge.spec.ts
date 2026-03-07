import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { createBridge } from '../bridge.ts'

const makeTransport = (): Transport => ({
  send: mock((_msg: JSONRPCMessage) => Promise.resolve()),
  start: mock(() => Promise.resolve()),
  close: mock(() => Promise.resolve()),
  onmessage: undefined,
  onerror: undefined,
  onclose: undefined,
})

// Flush the microtask queue so Promise.allSettled chains resolve
const flushAsync = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

const ping: JSONRPCMessage = { jsonrpc: '2.0', method: 'ping', id: 1 }
const pong: JSONRPCMessage = { jsonrpc: '2.0', result: {}, id: 1 }

describe('createBridge', () => {
  let exitSpy: ReturnType<typeof spyOn<NodeJS.Process, 'exit'>>
  let stderrSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as () => never)
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    exitSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  describe('message proxying', () => {
    test('forwards messages from stdio to http', () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      stdio.onmessage!(ping)

      expect(http.send).toHaveBeenCalledWith(ping)
      expect(stdio.send).not.toHaveBeenCalled()
    })

    test('forwards messages from http to stdio', () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onmessage!(pong)

      expect(stdio.send).toHaveBeenCalledWith(pong)
      expect(http.send).not.toHaveBeenCalled()
    })
  })

  describe('shutdown', () => {
    test('closes both transports when http closes', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onclose!()
      await flushAsync()

      expect(stdio.close).toHaveBeenCalledTimes(1)
      expect(http.close).toHaveBeenCalledTimes(1)
    })

    test('closes both transports when stdio closes', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      stdio.onclose!()
      await flushAsync()

      expect(stdio.close).toHaveBeenCalledTimes(1)
      expect(http.close).toHaveBeenCalledTimes(1)
    })

    test('does not close twice when both sides fire onclose', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onclose!()
      stdio.onclose!()
      await flushAsync()

      expect(stdio.close).toHaveBeenCalledTimes(1)
      expect(http.close).toHaveBeenCalledTimes(1)
    })

    test('exits with 0 after clean close', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onclose!()
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('error handling', () => {
    test('terminates with exit 1 on stdio transport error', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      stdio.onerror!(new Error('STDIO failed'))
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    test('terminates with exit 1 on http transport error', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onerror!(new Error('HTTP failed'))
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    test('terminates with exit 1 when http.send rejects', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      ;(http.send as ReturnType<typeof mock>).mockImplementation(() => Promise.reject(new Error('send failed')))
      createBridge(stdio, http)

      stdio.onmessage!(ping)
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    test('terminates with exit 1 when stdio.send rejects', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      ;(stdio.send as ReturnType<typeof mock>).mockImplementation(() => Promise.reject(new Error('send failed')))
      createBridge(stdio, http)

      http.onmessage!(pong)
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    test('does not exit twice when error follows close', async () => {
      const stdio = makeTransport()
      const http = makeTransport()
      createBridge(stdio, http)

      http.onclose!()
      http.onerror!(new Error('late error'))
      await flushAsync()

      expect(exitSpy).toHaveBeenCalledTimes(1)
    })
  })
})
