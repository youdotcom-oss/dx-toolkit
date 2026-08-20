import type { Transport } from '@modelcontextprotocol/client'

export const createBridge = (stdio: Transport, http: Transport): void => {
  let closing = false

  const shutdown = (): void => {
    if (closing) return
    closing = true
    void Promise.allSettled([stdio.close(), http.close()]).then(() => process.exit(0))
  }

  const terminate =
    (label: string) =>
    (error: unknown): void => {
      if (closing) return
      process.stderr.write(`${label} error: ${error}\n`)
      closing = true
      void Promise.allSettled([stdio.close(), http.close()]).then(() => process.exit(1))
    }

  stdio.onmessage = (message) => {
    void http.send(message).catch(terminate('HTTP send'))
  }
  http.onmessage = (message) => {
    void stdio.send(message).catch(terminate('STDIO send'))
  }

  stdio.onerror = terminate('STDIO') as (error: Error) => void
  http.onerror = terminate('HTTP') as (error: Error) => void

  http.onclose = shutdown
  stdio.onclose = shutdown
}
