import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import * as z from 'zod'
import { runCommand } from '../command-runner.ts'

describe('runCommand', () => {
  const TestSchema = z.object({
    value: z.string().describe('Test value'),
  })

  const TestResponseSchema = z.object({
    result: z.string(),
  })

  let originalApiKey: string | undefined

  beforeAll(() => {
    originalApiKey = process.env.YDC_API_KEY
  })

  afterAll(() => {
    if (originalApiKey) {
      process.env.YDC_API_KEY = originalApiKey
    } else {
      delete process.env.YDC_API_KEY
    }
  })

  describe('input handling', () => {
    test('accepts positional JSON argument', async () => {
      const originalLog = console.log
      process.env.YDC_API_KEY = 'test-key'

      let capturedInput: unknown
      console.log = () => {}

      await runCommand({
        args: ['{"value":"hello"}'],
        commandName: 'test',
        config: {
          schema: TestSchema,
          handler: async ({ input }) => {
            capturedInput = input
            return { result: 'ok' }
          },
        },
      })

      expect(capturedInput).toEqual({ value: 'hello' })
      console.log = originalLog
    })

    test('throws error when no input provided', async () => {
      process.env.YDC_API_KEY = 'test-key'

      expect(async () => {
        await runCommand({
          args: [],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        })
      }).toThrow('Input required')
    })

    test('throws error when JSON is malformed', async () => {
      process.env.YDC_API_KEY = 'test-key'

      expect(async () => {
        await runCommand({
          args: ['invalid-json'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        })
      }).toThrow()
    })
  })

  describe('--schema flag', () => {
    test('outputs input schema with --schema input', async () => {
      const originalExit = process.exit
      const originalLog = console.log

      process.exit = (() => {
        throw new Error('EXIT')
      }) as typeof process.exit

      let outputData = ''
      console.log = (data: string) => {
        outputData = data
      }

      await expect(
        runCommand({
          args: ['--schema', 'input'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        }),
      ).rejects.toThrow('EXIT')

      const schema = JSON.parse(outputData)
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.value).toBeDefined()

      process.exit = originalExit
      console.log = originalLog
    })

    test('outputs input schema with --schema (no value)', async () => {
      const originalExit = process.exit
      const originalLog = console.log

      process.exit = (() => {
        throw new Error('EXIT')
      }) as typeof process.exit

      let outputData = ''
      console.log = (data: string) => {
        outputData = data
      }

      await expect(
        runCommand({
          args: ['--schema'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        }),
      ).rejects.toThrow('EXIT')

      const schema = JSON.parse(outputData)
      expect(schema.type).toBe('object')
      expect(schema.properties.value).toBeDefined()

      process.exit = originalExit
      console.log = originalLog
    })

    test('outputs response schema with --schema output', async () => {
      const originalExit = process.exit
      const originalLog = console.log

      process.exit = (() => {
        throw new Error('EXIT')
      }) as typeof process.exit

      let outputData = ''
      console.log = (data: string) => {
        outputData = data
      }

      await expect(
        runCommand({
          args: ['--schema', 'output'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            responseSchema: TestResponseSchema,
            handler: async () => ({ result: 'test' }),
          },
        }),
      ).rejects.toThrow('EXIT')

      const schema = JSON.parse(outputData)
      expect(schema.type).toBe('object')
      expect(schema.properties.result).toBeDefined()

      process.exit = originalExit
      console.log = originalLog
    })

    test('throws when --schema output requested but no responseSchema', async () => {
      const originalExit = process.exit
      const originalLog = console.log

      process.exit = (() => {
        throw new Error('EXIT')
      }) as typeof process.exit
      console.log = () => {}

      expect(async () => {
        await runCommand({
          args: ['--schema', 'output'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        })
      }).toThrow('No output schema available')

      process.exit = originalExit
      console.log = originalLog
    })
  })

  describe('--help flag', () => {
    test('outputs per-command help with parameter table', async () => {
      const originalExit = process.exit
      const originalLog = console.log

      process.exit = (() => {
        throw new Error('EXIT')
      }) as typeof process.exit

      let outputData = ''
      console.log = (data: string) => {
        outputData = data
      }

      await expect(
        runCommand({
          args: ['--help'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            description: 'A test command',
            handler: async () => ({ result: 'test' }),
          },
        }),
      ).rejects.toThrow('EXIT')

      expect(outputData).toContain('ydc test')
      expect(outputData).toContain('A test command')
      expect(outputData).toContain('value*')
      expect(outputData).toContain('string')
      expect(outputData).toContain('Test value')

      process.exit = originalExit
      console.log = originalLog
    })
  })

  describe('API key handling', () => {
    test('throws error when API key is missing from both flag and env', async () => {
      const originalApiKey = process.env.YDC_API_KEY
      delete process.env.YDC_API_KEY

      expect(async () => {
        await runCommand({
          args: ['{"value":"test"}'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        })
      }).toThrow('YDC_API_KEY environment variable is required')

      if (originalApiKey) {
        process.env.YDC_API_KEY = originalApiKey
      }
    })

    test('resolves API key from --api-key flag over environment', async () => {
      const originalLog = console.log
      process.env.YDC_API_KEY = 'env-key'

      let capturedKey = ''
      console.log = () => {}

      await runCommand({
        args: ['{"value":"test"}', '--api-key', 'flag-key'],
        commandName: 'test',
        config: {
          schema: TestSchema,
          handler: async ({ YDC_API_KEY }) => {
            capturedKey = YDC_API_KEY
            return { result: 'test' }
          },
        },
      })

      expect(capturedKey).toBe('flag-key')
      console.log = originalLog
    })
  })

  describe('schema validation', () => {
    test('throws error when schema validation fails', async () => {
      process.env.YDC_API_KEY = 'test-key'

      expect(async () => {
        await runCommand({
          args: ['{"invalid":"field"}'],
          commandName: 'test',
          config: {
            schema: TestSchema,
            handler: async () => ({ result: 'test' }),
          },
        })
      }).toThrow()
    })
  })

  describe('command execution', () => {
    test('calls handler when all validations pass', async () => {
      const originalLog = console.log
      process.env.YDC_API_KEY = 'test-key'

      let handlerCalled = false
      let outputData = ''
      console.log = (data: string) => {
        outputData = data
      }

      await runCommand({
        args: ['{"value":"test"}'],
        commandName: 'test',
        config: {
          schema: TestSchema,
          handler: async () => {
            handlerCalled = true
            return { result: 'success' }
          },
        },
      })

      expect(handlerCalled).toBe(true)
      const output = JSON.parse(outputData)
      expect(output.result).toBe('success')
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

      await runCommand({
        args: ['{"value":"test"}', '--dry-run'],
        commandName: 'test',
        config: {
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
        },
      })

      expect(dryRunCalled).toBe(true)
      expect(handlerCalled).toBe(false)
      const output = JSON.parse(outputData)
      expect(output.url).toBe('https://test.com')
      console.log = originalLog
    })

    test('respects --client flag for User-Agent', async () => {
      const originalLog = console.log
      process.env.YDC_API_KEY = 'test-key'

      let capturedUserAgent = ''
      console.log = () => {}

      await runCommand({
        args: ['{"value":"test"}', '--client', 'TestClient'],
        commandName: 'test',
        config: {
          schema: TestSchema,
          handler: async ({ getUserAgent }) => {
            capturedUserAgent = getUserAgent()
            return { result: 'test' }
          },
        },
      })

      expect(capturedUserAgent).toContain('TestClient')
      console.log = originalLog
    })
  })
})
