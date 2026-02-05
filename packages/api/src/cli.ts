#!/usr/bin/env node
/**
 * ydc - You.com API CLI
 *
 * Commands:
 *   search <query>              - Search the web with You.com
 *   deep-search <query>         - Perform deep research with comprehensive answers
 *   contents <url> [url...]     - Extract content from URLs
 *
 * Options:
 *   --api-key <key>             - You.com API key (overrides YDC_API_KEY)
 *   --client <name>             - Client name for tracking (overrides YDC_CLIENT)
 *   --output <json|text>        - Output format (default: json)
 *   --help, -h                  - Show help
 */
import { parseArgs } from 'node:util'
import type * as z from 'zod'
import packageJson from '../package.json' with { type: 'json' }
import { ContentsQuerySchema } from './contents/contents.schemas.ts'
import { fetchContents } from './contents/contents.utils.ts'
import { DeepSearchQuerySchema } from './deep-search/deep-search.schemas.ts'
import { callDeepSearch } from './deep-search/deep-search.utils.ts'
import { SearchQuerySchema } from './search/search.schemas.ts'
import { fetchSearchResults } from './search/search.utils.ts'
import type { GetUserAgent } from './shared/api.types.ts'
import { type CommandConfig, runCommand } from './shared/command-runner.ts'
import { buildContentsRequest, buildDeepSearchRequest, buildSearchRequest } from './shared/dry-run-utils.ts'
import { generateErrorReportLink } from './shared/generate-error-report-link.ts'
import { useGetUserAgent } from './shared/use-get-user-agents.ts'

// Extract command and args (allows flags anywhere)
const rawArgs = process.argv.slice(2)
const command = rawArgs.find((arg) => !arg.startsWith('-')) || ''
const commandIndex = rawArgs.indexOf(command)
const args = commandIndex >= 0 ? rawArgs.slice(commandIndex + 1) : []

// Check for help
if (rawArgs.includes('--help') || rawArgs.includes('-h') || !command) {
  console.log(`ydc v${packageJson.version} - You.com API CLI

Usage: ydc <command> --json <json> [options]

Commands:
  search                      Search the web with You.com
  deep-search                 Perform deep research with comprehensive answers
  contents                    Extract content from URLs

Global Options:
  --json <json>               JSON string with command parameters (required)
  --api-key <key>             You.com API key (overrides YDC_API_KEY)
  --client <name>             Client name for tracking and debugging
  --schema                    Output JSON schema for what can be passed to --json
  --dry-run                   Show request details without making API call
  --help, -h                  Show this help

Environment Variables:
  YDC_API_KEY                 You.com API key (required)

Output Format:
  Success: API response on stdout (exit 0)
  Error: { success: false, error: {...} } on stderr (exit 1)
  Invalid args: Error message on stderr (exit 2)

Examples:
  ydc search --json '{"query":"AI developments"}' --client Openclaw
  ydc deep-search --json '{"query":"What are the latest breakthroughs in AI?","search_effort":"high"}' --client MyAgent
  ydc contents --json '{"urls":["https://example.com"],"formats":["markdown"]}'
  ydc search --schema  # Get JSON schema for search --json input
  ydc search --json '{"query":"AI"}' --dry-run  # Inspect request without API call
  ydc search --json '{"query":"AI"}' | jq '.data.results.web[0].title'

More info: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/api
`)
  process.exit(command ? 0 : 2)
}

// Command configuration map
const commands = {
  search: {
    schema: SearchQuerySchema,
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
  'deep-search': {
    schema: DeepSearchQuerySchema,
    handler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof DeepSearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => callDeepSearch({ deepSearchQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({
      input,
      YDC_API_KEY,
      getUserAgent,
    }: {
      input: z.infer<typeof DeepSearchQuerySchema>
      YDC_API_KEY: string
      getUserAgent: GetUserAgent
    }) => buildDeepSearchRequest({ deepSearchQuery: input, YDC_API_KEY, getUserAgent }),
  },
  contents: {
    schema: ContentsQuerySchema,
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

// Validate command
if (!(command in commands)) {
  console.error(`Unknown command: ${command}`)
  console.error(`Run 'ydc --help' for usage`)
  process.exit(2)
}

// Execute command
try {
  // Type assertion is safe because we validated command exists above
  await runCommand(args, commands[command as keyof typeof commands] as CommandConfig<unknown, unknown>)
  process.exit(0)
} catch (error) {
  console.error(error)
  const message = error instanceof Error ? error.message : String(error)
  const { values } = parseArgs({
    args,
    options: {
      client: { type: 'string' },
    },
  })
  const getUserAgent = useGetUserAgent(values.client || process.env.YDC_CLIENT)
  console.error('\nTo report this error, share this mailto link with the user:')
  console.error(generateErrorReportLink({ errorMessage: message, tool: command, clientInfo: getUserAgent() }))
  process.exit(1)
}
