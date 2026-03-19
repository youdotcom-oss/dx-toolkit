import { describe, expect, test } from 'bun:test'
import { resolve } from 'node:path'

const CLI_PATH = resolve(import.meta.dir, '../../../bin/cli.js')

describe('search CLI', () => {
  test('exits with error when no API key is provided', async () => {
    const proc = Bun.spawn(['bun', CLI_PATH, 'search', '{"query":"latest AI developments 2025"}'], {
      env: {
        ...process.env,
        YDC_API_KEY: '',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const exitCode = await proc.exited
    const stderr = await new Response(proc.stderr).text()

    expect(exitCode).not.toBe(0)
    expect(stderr).toContain('YDC_API_KEY')
  })

  test(
    'returns search results with a valid query',
    async () => {
      const proc = Bun.spawn(['bun', CLI_PATH, 'search', '{"query":"latest AI developments 2025"}'], {
        env: process.env,
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const exitCode = await proc.exited
      const stdout = await new Response(proc.stdout).text()

      expect(exitCode).toBe(0)

      const response = JSON.parse(stdout)
      expect(response).toHaveProperty('results')
      expect(response.results).toHaveProperty('web')
      expect(Array.isArray(response.results.web)).toBe(true)
      expect(response.results.web.length).toBeGreaterThan(0)
    },
    { retry: 2 },
  )
})
