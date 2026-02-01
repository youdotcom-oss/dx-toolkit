#!/usr/bin/env node
/**
 * ydc - You.com API CLI
 *
 * Commands:
 *   search <query>              - Search the web with You.com
 *   express <input>             - Get AI answers with web context
 *   contents <url> [url...]     - Extract content from URLs
 *
 * Options:
 *   --api-key <key>             - You.com API key (overrides YDC_API_KEY)
 *   --client <name>             - Client name for tracking (overrides YDC_CLIENT)
 *   --output <json|text>        - Output format (default: json)
 *   --help, -h                  - Show help
 */
import { parseArgs } from 'node:util'
import packageJson from '../package.json' with { type: 'json' }
import { contentsCommand } from './commands/contents.ts'
import { expressCommand } from './commands/express.ts'
import { searchCommand } from './commands/search.ts'
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
  express                     Get AI answers with web context
  contents                    Extract content from URLs

Global Options:
  --json <json>               JSON string with command parameters (required)
  --api-key <key>             You.com API key (overrides YDC_API_KEY)
  --client <name>             Client name for tracking and debugging
  --schema                    Output JSON schema for what can be passed to --json
  --help, -h                  Show this help

Environment Variables:
  YDC_API_KEY                 You.com API key (required)

Output Format:
  Success: API response on stdout (exit 0)
  Error: { success: false, error: {...} } on stderr (exit 1)
  Invalid args: Error message on stderr (exit 2)

Examples:
  ydc search --json '{"query":"AI developments"}' --client Openclaw
  ydc express --json '{"input":"What happened today?","tools":[{"type":"web_search"}]}' --client MyAgent
  ydc contents --json '{"urls":["https://example.com"],"formats":["markdown"]}'
  ydc search --schema  # Get JSON schema for search --json input
  ydc search --json '{"query":"AI"}' | jq '.data.results.web[0].title'

More info: https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/api
`)
  process.exit(command ? 0 : 2)
}

try {
  switch (command) {
    case 'search':
      await searchCommand(args)
      break
    case 'express':
      await expressCommand(args)
      break
    case 'contents':
      await contentsCommand(args)
      break
    default:
      console.error(`Unknown command: ${command}`)
      console.error(`Run 'ydc --help' for usage`)
      process.exit(2)
  }
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
