/**
 * Shared command infrastructure for CLI commands
 * Handles flag parsing, validation, and execution
 *
 * @internal
 */

import * as z from 'zod'
import type { GetUserAgent } from './api.types.ts'
import type { DryRunResult } from './dry-run-utils.ts'
import { generateCommandHelp } from './generate-command-help.ts'
import { useGetUserAgent } from './use-get-user-agents.ts'

/**
 * Configuration for a command
 *
 * @typeParam TInput - Zod-inferred input type
 * @typeParam TOutput - Command output type
 */
export type CommandConfig<TInput, TOutput> = {
  schema: z.ZodType<TInput>
  responseSchema?: z.ZodType
  description?: string
  handler: (params: { input: TInput; YDC_API_KEY: string; getUserAgent: GetUserAgent }) => Promise<TOutput>
  dryRunHandler?: (params: { input: TInput; YDC_API_KEY: string; getUserAgent: GetUserAgent }) => DryRunResult
}

/**
 * Read JSON input from stdin (when piped)
 *
 * @internal
 */
const readStdin = async (): Promise<string | null> => {
  if (process.stdin.isTTY) return null
  return await Bun.stdin.text()
}

/**
 * Extract the schema target from args: --schema, --schema input, --schema output
 * Returns null if --schema is not present
 *
 * @internal
 */
const parseSchemaFlag = (args: string[]): 'input' | 'output' | null => {
  const idx = args.indexOf('--schema')
  if (idx === -1) return null

  const next = args[idx + 1]
  if (next === 'output') return 'output'
  // --schema, --schema input, or --schema followed by another flag
  return 'input'
}

/**
 * Extract positional args (non-flag arguments) from args array
 * A flag is anything starting with -- and its value
 *
 * @internal
 */
const extractPositionalArgs = (args: string[]): string[] => {
  const positionals: string[] = []
  // Known flags that take a value
  const valuedFlags = new Set(['--api-key', '--client', '--schema'])

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg === '--dry-run') {
      i++
      continue
    }
    if (arg?.startsWith('--')) {
      // Skip flag and its value if it's a valued flag
      if (valuedFlags.has(arg)) {
        i += 2
      } else {
        i++
      }
      continue
    }
    if (arg !== undefined) {
      positionals.push(arg)
    }
    i++
  }
  return positionals
}

/**
 * Run a command with standardized flag parsing and validation
 * Handles --schema, positional/stdin input, --api-key, --client, and --dry-run flags
 *
 * @param args - Command line arguments (after command name)
 * @param commandName - Name of the command (for help display)
 * @param config - Command configuration with schema and handler
 *
 * @internal
 */
export const runCommand = async <TInput, TOutput>({
  args,
  commandName,
  config,
}: {
  args: string[]
  commandName: string
  config: CommandConfig<TInput, TOutput>
}) => {
  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    const jsonSchema = z.toJSONSchema(config.schema) as Record<string, unknown>
    const help = generateCommandHelp({
      jsonSchema,
      commandName,
      description: config.description,
    })
    console.log(help)
    process.exit(0)
  }

  // Handle --schema flag
  const schemaTarget = parseSchemaFlag(args)
  if (schemaTarget) {
    if (schemaTarget === 'output') {
      if (!config.responseSchema) {
        throw new Error('No output schema available for this command')
      }
      console.log(JSON.stringify(z.toJSONSchema(config.responseSchema)))
    } else {
      console.log(JSON.stringify(z.toJSONSchema(config.schema)))
    }
    process.exit(0)
  }

  // Get JSON input: positional arg > stdin
  const positionals = extractPositionalArgs(args)
  let jsonInput: string | undefined

  if (positionals.length > 0) {
    jsonInput = positionals[0]
  } else {
    const stdinData = await readStdin()
    if (stdinData) {
      jsonInput = stdinData.trim()
    }
  }

  if (!jsonInput) {
    throw new Error('Input required: pass JSON as argument or pipe via stdin')
  }

  // Parse JSON input
  const input = JSON.parse(jsonInput)

  // Parse remaining flags
  // Filter out positional and --schema args before parseArgs
  const flagArgs = args.filter((arg) => positionals.indexOf(arg) === -1)
  const schemaIdx = flagArgs.indexOf('--schema')
  if (schemaIdx !== -1) {
    // Remove --schema and its optional value
    const next = flagArgs[schemaIdx + 1]
    const removeCount = next && !next.startsWith('--') ? 2 : 1
    flagArgs.splice(schemaIdx, removeCount)
  }

  const { parseArgs } = await import('node:util')
  const { values } = parseArgs({
    args: flagArgs,
    options: {
      'api-key': { type: 'string' },
      client: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  })

  const apiKey = values['api-key']
  const client = values.client || process.env.YDC_CLIENT

  // Get API key from options or environment
  const YDC_API_KEY = apiKey || process.env.YDC_API_KEY
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY environment variable is required')
  }

  // Validate with schema
  const validatedInput = config.schema.parse(input)

  // Create getUserAgent function
  const getUserAgent = useGetUserAgent(client)

  // Handle --dry-run flag
  if (values['dry-run'] && config.dryRunHandler) {
    const dryRunResult = config.dryRunHandler({
      input: validatedInput,
      YDC_API_KEY,
      getUserAgent,
    })
    console.log(JSON.stringify(dryRunResult))
    return
  }

  // Execute handler
  const response = await config.handler({
    input: validatedInput,
    YDC_API_KEY,
    getUserAgent,
  })

  // Output response to stdout (success)
  console.log(JSON.stringify(response))
}
