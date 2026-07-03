#!/usr/bin/env node
import packageJson from '../package.json' with { type: 'json' }
import {
  type CommandName,
  runFetch,
  runFinanceResearch,
  runRaw,
  runResearch,
  runSchema,
  runSearch,
  runTools,
} from './commands.ts'

const USAGE = `Usage: ydc <command> [args] [flags]

Primary commands:
  search <query>                Web and news search (you-search)
  fetch <url> [<url>...]        Extract page content (you-contents)
  research <input>              Deep research with citations (you-research)
  finance-research <input>      Deep finance research (you-finance)

Utilities:
  tools                         Print the local tool contract and command map
  schema <tool> [input|output]  Print remote JSON Schema for a tool
  raw <tool> [<json>]           Call a remote tool with raw JSON arguments

Global flags:
  --api-key <key>               API key (overrides YDC_API_KEY)
  -o, --output <file>           Write JSON output to file
  --pretty                      Pretty-print JSON output
  --dry-run                     Print resolved request without executing
  -h, --help                    Show help
  -V, --version                 Show version

Per-command help:
  ydc <command> --help`

type Command = CommandName | 'tools' | 'schema' | 'raw'

const HANDLERS: Record<Command, (argv: string[]) => Promise<void>> = {
  fetch: runFetch,
  'finance-research': runFinanceResearch,
  raw: runRaw,
  research: runResearch,
  schema: runSchema,
  search: runSearch,
  tools: runTools,
}

const isCommand = (value: string): value is Command => value in HANDLERS

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2)
  const [command, ...rest] = argv

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE)
    process.exit(0)
  }

  if (command === '--version' || command === '-V') {
    console.log(packageJson.version)
    process.exit(0)
  }

  if (!isCommand(command)) {
    console.error(`Unknown command: ${command}`)
    console.error('')
    console.error(USAGE)
    process.exit(1)
  }

  await HANDLERS[command](rest)
}

await main()
