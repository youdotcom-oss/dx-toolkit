#!/usr/bin/env node
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { createBridge } from './bridge.ts'

const url = new URL('https://api.you.com/mcp')
const headers: Record<string, string> = {}

if (process.env.YDC_API_KEY) {
  headers.Authorization = `Bearer ${process.env.YDC_API_KEY}`
}

if (process.env?.YDC_PROFILE === 'free') {
  url.searchParams.set('profile', process.env?.YDC_PROFILE)
} else if (process.env?.YDC_ALLOWED_TOOLS) {
  url.searchParams.set('tools', process.env.YDC_ALLOWED_TOOLS)
}

try {
  const stdio = new StdioServerTransport()
  const http = new StreamableHTTPClientTransport(url, { requestInit: { headers } })

  createBridge(stdio, http)

  await http.start()
  await stdio.start()
} catch (error) {
  process.stderr.write(`Failed to start STDIO bridge: ${error}\n`)
  process.exit(1)
}
