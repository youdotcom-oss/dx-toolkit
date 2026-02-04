import { describe, expect, test } from 'bun:test'
import * as z from 'zod'
import { runCommand } from '../command-runner.ts'

describe('runCommand', () => {
  const TestSchema = z.object({
    value: z.string(),
  })

  test('outputs JSON schema when --schema flag is provided', async () => {
    const originalExit = process.exit
    const originalLog = console.log

    process.exit = (() => {
      throw new Error('EXIT')
    }) as typeof process.exit

    let outputData = ''
    console.log = (data: string) => {
      outputData = data
    }

    try {
      await runCommand(['--schema'], {
        schema: TestSchema,
        handler: async () => ({ result: 'test' }),
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'EXIT') {
        const schema = JSON.parse(outputData)
        expect(schema.type).toBe('object')
        expect(schema.properties).toBeDefined()
      }
    }

    // Restore original functions
    process.exit = originalExit
    console.log = originalLog
  })

  test('throws error when --json flag is missing', async () => {
    expect(async () => {
      await runCommand([], {
        schema: TestSchema,
        handler: async () => ({ result: 'test' }),
      })
    }).toThrow('--json flag is required')
  })

  test('throws error when JSON is malformed', async () => {
    expect(async () => {
      await runCommand(['--json', 'invalid-json'], {
        schema: TestSchema,
        handler: async () => ({ result: 'test' }),
      })
    }).toThrow()
  })

  test('throws error when API key is missing from both flag and env', async () => {
    const originalApiKey = process.env.YDC_API_KEY
    delete process.env.YDC_API_KEY

    expect(async () => {
      await runCommand(['--json', '{"value":"test"}'], {
        schema: TestSchema,
        handler: async () => ({ result: 'test' }),
      })
    }).toThrow('YDC_API_KEY environment variable is required')

    // Restore original value
    if (originalApiKey) {
      process.env.YDC_API_KEY = originalApiKey
    }
  })

  test('resolves API key from --api-key flag over environment', async () => {
    const originalLog = console.log
    process.env.YDC_API_KEY = 'env-key'

    let capturedKey = ''
    console.log = () => {
      // Suppress output
    }

    await runCommand(['--json', '{"value":"test"}', '--api-key', 'flag-key'], {
      schema: TestSchema,
      handler: async ({ YDC_API_KEY }) => {
        capturedKey = YDC_API_KEY
        return { result: 'test' }
      },
    })

    expect(capturedKey).toBe('flag-key')

    // Restore original function
    console.log = originalLog
  })

  test('throws error when schema validation fails', async () => {
    process.env.YDC_API_KEY = 'test-key'

    expect(async () => {
      await runCommand(['--json', '{"invalid":"field"}'], {
        schema: TestSchema,
        handler: async () => ({ result: 'test' }),
      })
    }).toThrow()
  })

  test('calls handler when all validations pass', async () => {
    const originalLog = console.log
    process.env.YDC_API_KEY = 'test-key'

    let handlerCalled = false
    let outputData = ''
    console.log = (data: string) => {
      outputData = data
    }

    await runCommand(['--json', '{"value":"test"}'], {
      schema: TestSchema,
      handler: async () => {
        handlerCalled = true
        return { result: 'success' }
      },
    })

    expect(handlerCalled).toBe(true)
    const output = JSON.parse(outputData)
    expect(output.result).toBe('success')

    // Restore original function
    console.log = originalLog
  })

  test('calls dryRunHandler when --dry-run flag is provided', async () => {
    const originalLog = console.log
    process.env.YDC_API_KEY = 'test-key'

    let dryRunCalled = false
    let handlerCalled = false
    let outputData = ''
    console.log = (data: string) => {
      outputData = data
    }

    await runCommand(['--json', '{"value":"test"}', '--dry-run'], {
      schema: TestSchema,
      handler: async () => {
        handlerCalled = true
        return { result: 'success' }
      },
      dryRunHandler: () => {
        dryRunCalled = true
        return {
          url: 'https://test.com',
          method: 'GET',
          headers: { 'X-API-Key': 'test-key' },
        }
      },
    })

    expect(dryRunCalled).toBe(true)
    expect(handlerCalled).toBe(false)
    const output = JSON.parse(outputData)
    expect(output.url).toBe('https://test.com')

    // Restore original function
    console.log = originalLog
  })

  test('respects --client flag for User-Agent', async () => {
    const originalLog = console.log
    process.env.YDC_API_KEY = 'test-key'

    let capturedUserAgent = ''
    console.log = () => {
      // Suppress output
    }

    await runCommand(['--json', '{"value":"test"}', '--client', 'TestClient'], {
      schema: TestSchema,
      handler: async ({ getUserAgent }) => {
        capturedUserAgent = getUserAgent()
        return { result: 'test' }
      },
    })

    expect(capturedUserAgent).toContain('TestClient')

    // Restore original function
    console.log = originalLog
  })
})
