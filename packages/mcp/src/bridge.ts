import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

/**
 * Wires bidirectional message proxying between a stdio server transport and
 * a streamable HTTP client transport.
 *
 * @remarks
 * Guards against double-close cycles via a `closing` flag. Terminates the
 * process with exit code 0 on clean shutdown and exit code 1 on transport
 * errors or failed sends.
 *
 * @param stdio - The local StdioServerTransport
 * @param http - The remote StreamableHTTPClientTransport
 *
 * @public
 */
export const createBridge = (stdio: Transport, http: Transport): void => {
  let closing = false

  const shutdown = (): void => {
    if (closing) return
    closing = true
    void Promise.allSettled([stdio.close(), http.close()]).then(() => process.exit(0))
  }

  const terminate =
    (label: string) =>
    (err: unknown): void => {
      process.stderr.write(`${label} error: ${err}\n`)
      if (closing) return
      closing = true
      void Promise.allSettled([stdio.close(), http.close()]).then(() => process.exit(1))
    }

  stdio.onmessage = (message) => {
    void http.send(message).catch(terminate('HTTP send'))
  }
  http.onmessage = (message) => {
    void stdio.send(message).catch(terminate('STDIO send'))
  }

  stdio.onerror = terminate('STDIO') as (err: Error) => void
  http.onerror = terminate('HTTP') as (err: Error) => void

  http.onclose = shutdown
  stdio.onclose = shutdown
}
