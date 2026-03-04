#!/usr/bin/env node
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const url = new URL(process.env.MCP_SERVER_URL || 'https://api.you.com/mcp')
const headers: Record<string, string> = {}
if (process.env.YDC_API_KEY) {
  headers.Authorization = `Bearer ${process.env.YDC_API_KEY}`
}

try {
  const stdio = new StdioServerTransport()
  const http = new StreamableHTTPClientTransport(url, { requestInit: { headers } })

  // Proxy messages bidirectionally: STDIO client ↔ HTTP remote server
  stdio.onmessage = (message) => http.send(message)
  http.onmessage = (message) => stdio.send(message)

  stdio.onerror = (error) => process.stderr.write(`STDIO error: ${error}\n`)
  http.onerror = (error) => process.stderr.write(`HTTP error: ${error}\n`)

  http.onclose = () => stdio.close()
  stdio.onclose = () => http.close()

  // Start HTTP transport first (needs to be ready before STDIO starts reading)
  await http.start()
  await stdio.start()
} catch (error) {
  process.stderr.write(`Failed to start STDIO bridge: ${error}\n`)
  process.exit(1)
}
