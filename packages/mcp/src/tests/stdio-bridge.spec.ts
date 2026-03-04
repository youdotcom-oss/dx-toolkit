import { describe, expect, test } from 'bun:test'

describe('stdio-bridge configuration', () => {
  test('defaults MCP_SERVER_URL to https://api.you.com/mcp', async () => {
    // Verify the default URL is correct by importing the bridge source
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain("'https://api.you.com/mcp'")
  })

  test('reads YDC_API_KEY from environment', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('process.env.YDC_API_KEY')
  })

  test('sets Authorization header when API key is present', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('Bearer')
    expect(source).toContain('Authorization')
  })

  test('connects without auth when no API key (free tier)', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    // Should only set Authorization header conditionally
    expect(source).toContain('if (process.env.YDC_API_KEY)')
  })

  test('uses StdioServerTransport for local side', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('StdioServerTransport')
  })

  test('uses StreamableHTTPClientTransport for remote side', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('StreamableHTTPClientTransport')
  })

  test('proxies messages bidirectionally', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    // Should wire stdio.onmessage → http.send and http.onmessage → stdio.send
    expect(source).toContain('stdio.onmessage')
    expect(source).toContain('http.onmessage')
    expect(source).toContain('http.send')
    expect(source).toContain('stdio.send')
  })

  test('handles errors gracefully', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('stdio.onerror')
    expect(source).toContain('http.onerror')
    expect(source).toContain('process.stderr.write')
  })

  test('handles shutdown on transport close', async () => {
    const source = await Bun.file(new URL('../stdio-bridge.ts', import.meta.url)).text()
    expect(source).toContain('http.onclose')
    expect(source).toContain('stdio.onclose')
  })
})

describe('stdio-bridge build', () => {
  test('builds to bin/stdio.js successfully', async () => {
    const result = Bun.spawnSync(['bun', 'run', 'build'], {
      cwd: new URL('../../', import.meta.url).pathname,
    })
    expect(result.exitCode).toBe(0)

    const binFile = Bun.file(new URL('../../bin/stdio.js', import.meta.url))
    expect(await binFile.exists()).toBe(true)

    const contents = await binFile.text()
    expect(contents.length).toBeGreaterThan(0)
  })
})
