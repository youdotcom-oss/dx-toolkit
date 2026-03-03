#!/usr/bin/env node
/**
 * ydc - You.com API CLI
 *
 * @internal
 */
import type * as z from 'zod'
import packageJson from '../package.json' with { type: 'json' }
import { ContentsApiResponseSchema, ContentsQuerySchema } from './contents/contents.schemas.ts'
import { fetchContents } from './contents/contents.utils.ts'
import { ResearchQuerySchema, ResearchResponseSchema } from './research/research.schemas.ts'
import { callResearch } from './research/research.utils.ts'
import { SearchQuerySchema, SearchResponseSchema } from './search/search.schemas.ts'
import { fetchSearchResults } from './search/search.utils.ts'
import type { GetUserAgent } from './shared/api.types.ts'
import { type CommandConfig, runCommand } from './shared/command-runner.ts'
import { buildContentsRequest, buildResearchRequest, buildSearchRequest } from './shared/dry-run-utils.ts'
import { generateErrorReportLink } from './shared/generate-error-report-link.ts'
import { useGetUserAgent } from './shared/use-get-user-agents.ts'

// Extract command and remaining args
const rawArgs = process.argv.slice(2)
const command = rawArgs.find((arg) => !arg.startsWith('-')) || ''
const commandIndex = rawArgs.indexOf(command)

// Command configuration map
const commands = {
  search: {
    schema: SearchQuerySchema,
    responseSchema: SearchResponseSchema,
    description: 'Search the web with You.com',
    handler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof SearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => fetchSearchResults({ searchQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof SearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => buildSearchRequest({ searchQuery: input, YDC_API_KEY, getUserAgent }),
  },
  research: {
    schema: ResearchQuerySchema,
    responseSchema: ResearchResponseSchema,
    description: 'Deep research with comprehensive answers',
    handler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof ResearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => callResearch({ researchQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof ResearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => buildResearchRequest({ researchQuery: input, YDC_API_KEY, getUserAgent }),
  },
  contents: {
    schema: ContentsQuerySchema,
    responseSchema: ContentsApiResponseSchema,
    description: 'Extract content from URLs',
    handler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof ContentsQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => fetchContents({ contentsQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof ContentsQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => buildContentsRequest({ contentsQuery: input, YDC_API_KEY, getUserAgent }),
  },
}

// Check for per-command help (ydc <cmd> --help) vs global help
const hasHelpFlag = rawArgs.includes('--help') || rawArgs.includes('-h')
const isValidCommand = command in commands

// Show global help when: no command, or --help without a valid command
if ((!command && !hasHelpFlag) || (hasHelpFlag && !isValidCommand)) {
  console.log(`ydc v${packageJson.version} - You.com API CLI

Usage: ydc <command> <json> [options]
       echo <json> | ydc <command> [options]

Commands:
  search      Search the web with You.com
  research    Deep research with comprehensive answers
  contents    Extract content from URLs

Options:
  --schema <input|output>   Print JSON Schema and exit
  --dry-run                 Show request without API call
  --api-key <key>           Override YDC_API_KEY
  --client <name>           Client tracking
  -h, --help                Show help (per-command with ydc <cmd> --help)

Input: JSON via first argument or stdin pipe
Output: JSON on stdout, errors on stderr

Examples:
  ydc search '{"query":"AI developments"}' --client ClaudeCode
  echo '{"query":"AI"}' | ydc search
  ydc search --schema input | jq '.properties | keys'
  ydc search --schema output
  ydc search --help`)
  process.exit(command ? 0 : 2)
}

// Validate command
if (!isValidCommand) {
  console.error(`Unknown command: ${command}`)
  console.error(`Run 'ydc --help' for usage`)
  process.exit(2)
}

// Build args: everything after the command name
const args = commandIndex >= 0 ? rawArgs.slice(commandIndex + 1) : []

// Execute command
try {
  await runCommand({
    args,
    commandName: command,
    config: commands[command as keyof typeof commands] as CommandConfig<unknown, unknown>,
  })
  process.exit(0)
} catch (error) {
  console.error(error)
  const message = error instanceof Error ? error.message : String(error)

  // Extract --client from args for error reporting
  const clientIdx = args.indexOf('--client')
  const client = clientIdx >= 0 ? args[clientIdx + 1] : process.env.YDC_CLIENT
  const getUserAgent = useGetUserAgent(client)

  console.error('\nTo report this error, share this mailto link with the user:')
  console.error(generateErrorReportLink({ errorMessage: message, tool: command, clientInfo: getUserAgent() }))
  process.exit(1)
}
