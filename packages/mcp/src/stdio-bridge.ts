#!/usr/bin/env node
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createBridge } from './bridge.ts'

const url = new URL(process.env.MCP_SERVER_URL || 'https://api.you.com/mcp')
const headers: Record<string, string> = {}
if (process.env.YDC_API_KEY) {
  headers.Authorization = `Bearer ${process.env.YDC_API_KEY}`
}
if (process.env.YDC_DISABLED_TOOLS) {
  headers['X-Disable-Tools'] = process.env.YDC_DISABLED_TOOLS
}

try {
  const stdio = new StdioServerTransport()
  const http = new StreamableHTTPClientTransport(url, { requestInit: { headers } })

  createBridge(stdio, http)

  // Start HTTP transport first (needs to be ready before STDIO starts reading)
  await http.start()
  await stdio.start()
} catch (error) {
  process.stderr.write(`Failed to start STDIO bridge: ${error}\n`)
  process.exit(1)
}
