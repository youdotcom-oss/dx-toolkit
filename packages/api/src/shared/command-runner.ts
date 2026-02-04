/**
 * Shared command infrastructure for CLI commands
 * Handles flag parsing, validation, and execution
 *
 * @internal
 */

import { parseArgs } from 'node:util'
import * as z from 'zod'
import type { GetUserAgent } from './api.types.ts'
import type { DryRunResult } from './dry-run-utils.ts'
import { useGetUserAgent } from './use-get-user-agents.ts'

/**
 * Configuration for a command
 *
 * @typeParam TInput - Zod-inferred input type
 * @typeParam TOutput - Command output type
 */
export type CommandConfig<TInput, TOutput> = {
  schema: z.ZodType<TInput>
  handler: (params: { input: TInput; YDC_API_KEY: string; getUserAgent: GetUserAgent }) => Promise<TOutput>
  dryRunHandler?: (params: { input: TInput; YDC_API_KEY: string; getUserAgent: GetUserAgent }) => DryRunResult
}

/**
 * Run a command with standardized flag parsing and validation
 * Handles --schema, --json, --api-key, --client, and --dry-run flags
 *
 * @param args - Command line arguments
 * @param config - Command configuration with schema and handler
 *
 * @internal
 */
export const runCommand = async <TInput, TOutput>(args: string[], config: CommandConfig<TInput, TOutput>) => {
  // Handle --schema flag
  if (args.includes('--schema')) {
    console.log(JSON.stringify(z.toJSONSchema(config.schema)))
    process.exit(0)
  }

  // Parse flags with Node's built-in parseArgs
  const { values } = parseArgs({
    args,
    options: {
      json: { type: 'string' },
      'api-key': { type: 'string' },
      client: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  })

  // --json is required
  if (!values.json) {
    throw new Error('--json flag is required')
  }

  // Parse JSON input
  const input = JSON.parse(values.json)
  const apiKey = values['api-key']
  const client = values.client || process.env.YDC_CLIENT

  // Get API key from options or environment
  const YDC_API_KEY = apiKey || process.env.YDC_API_KEY
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY environment variable is required')
  }

  // Validate with schema
  const validatedInput = config.schema.parse(input) as TInput

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
