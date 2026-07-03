import { writeFile } from 'node:fs/promises'
import { type FlagSpec, type FlagValues, type GlobalFlags, parseArgs } from './cli-args.ts'
import { buildToolUrl, getAuthHeaders, normalizeToolResult, sanitizeHeaders, withClient } from './mcp.ts'
import { TOOL_CONTRACT } from './tools.ts'

export const COMMAND_TOOL_MAP = {
  search: 'you-search',
  fetch: 'you-contents',
  research: 'you-research',
  'finance-research': 'you-finance',
} as const

export type CommandName = keyof typeof COMMAND_TOOL_MAP

const FREE_PROFILE_TOOLS = TOOL_CONTRACT.tools.filter((tool) => tool.supportsFreeProfile).map(({ name }) => name)

const GLOBAL_FLAGS: FlagSpec[] = [
  { kind: 'string', long: '--api-key' },
  { kind: 'string', long: '--output', short: '-o' },
  { kind: 'bool', long: '--pretty' },
  { kind: 'bool', long: '--dry-run' },
]

const PROFILE_FLAG: FlagSpec = { kind: 'string', long: '--profile' }

const SEARCH_INPUT_FLAGS: FlagSpec[] = [
  { kind: 'int', long: '--count' },
  { kind: 'int', long: '--offset' },
  { kind: 'string', long: '--freshness' },
  { kind: 'string', long: '--country' },
  { kind: 'string', long: '--language' },
  { kind: 'string', long: '--safesearch' },
  { kind: 'string', long: '--livecrawl' },
  { kind: 'csv', long: '--livecrawl-formats' },
  { kind: 'csv', long: '--include-domains' },
  { kind: 'csv', long: '--exclude-domains' },
  { kind: 'int', long: '--crawl-timeout' },
]

const FETCH_INPUT_FLAGS: FlagSpec[] = [
  { kind: 'csv', long: '--formats' },
  { kind: 'int', long: '--crawl-timeout' },
]

const RESEARCH_INPUT_FLAGS: FlagSpec[] = [{ kind: 'string', long: '--effort' }]

const HELP_TEXTS: Record<string, string> = {
  search: `Usage: ydc search <query> [flags]

Web and news search via the you-search tool.

Input flags:
  --count <int>                  Max results per section (1-100)
  --offset <int>                 Pagination offset (0-9)
  --freshness <value>            day | week | month | year | YYYY-MM-DDtoYYYY-MM-DD
  --country <code>               ISO country code (e.g. US, GB, DE)
  --language <code>              BCP 47 language code (e.g. EN, ES)
  --safesearch <value>           off | moderate | strict
  --livecrawl <value>            web | news | all
  --livecrawl-formats <csv>      html, markdown
  --include-domains <csv>        Domains to include (max 500)
  --exclude-domains <csv>        Domains to exclude (max 500)
  --crawl-timeout <int>          Live-crawl timeout in seconds (1-60)
  --profile free                 Free search profile (no API key required)

Global flags: --api-key, --output, --pretty, --dry-run, --help`,
  fetch: `Usage: ydc fetch <url> [<url>...] [flags]

Extract page content via the you-contents tool. Reads URLs from positional
arguments or whitespace-separated stdin when no positional URLs are given.

Input flags:
  --formats <csv>                markdown, html, metadata (default: markdown)
  --crawl-timeout <int>          Crawl timeout in seconds (1-60)

Global flags: --api-key, --output, --pretty, --dry-run, --help`,
  research: `Usage: ydc research <input> [flags]

Deep research with citations via the you-research tool.

Input flags:
  --effort <value>               lite | standard | deep | exhaustive (default: standard)

Global flags: --api-key, --output, --pretty, --dry-run, --help`,
  'finance-research': `Usage: ydc finance-research <input> [flags]

Deep finance research via the you-finance tool. Investigates SEC filings,
earnings, financial data, and company metrics.

Input flags:
  --effort <value>               deep | exhaustive (default: deep)

Global flags: --api-key, --output, --pretty, --dry-run, --help`,
  raw: `Usage: ydc raw <tool> [<json>] [flags]

Call a remote MCP tool with raw JSON input. Reads JSON from stdin when the
positional argument is omitted.

Allowed tools: ${TOOL_CONTRACT.tools.map(({ name }) => name).join(', ')}

Flags: --api-key, --profile, --output, --pretty, --dry-run, --help`,
  schema: `Usage: ydc schema <tool> [input|output] [flags]

Print the remote JSON Schema for a tool. Defaults to the input schema.

Allowed tools: ${TOOL_CONTRACT.tools.map(({ name }) => name).join(', ')}

Flags: --api-key, --profile, --output, --pretty, --help`,
  tools: `Usage: ydc tools [flags]

Print the local tool contract and command map.

Flags: --output, --pretty, --help`,
}

const handleHelp = (argv: string[], command: string): void => {
  if (!argv.includes('--help') && !argv.includes('-h')) {
    return
  }

  console.log(HELP_TEXTS[command])
  process.exit(0)
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const extractGlobalFlags = (flags: FlagValues): GlobalFlags => ({
  apiKey: typeof flags['api-key'] === 'string' ? flags['api-key'] : undefined,
  dryRun: flags['dry-run'] === true,
  output: typeof flags.output === 'string' ? flags.output : undefined,
  pretty: flags.pretty === true,
})

const writeJson = async (value: unknown, options: GlobalFlags): Promise<void> => {
  const text = JSON.stringify(value, null, options.pretty ? 2 : undefined)

  if (options.output) {
    await writeFile(options.output, text)
    return
  }

  console.log(text)
}

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    return ''
  }

  const chunks: Uint8Array[] = []

  for await (const chunk of process.stdin) {
    chunks.push(chunk as Uint8Array)
  }

  return Buffer.concat(chunks).toString('utf8').trim()
}

const buildInputFromFlags = (flags: FlagValues, specs: FlagSpec[]): Record<string, unknown> => {
  const input: Record<string, unknown> = {}

  for (const spec of specs) {
    const key = spec.long.replace(/^--/, '')
    const value = flags[key]

    if (value === undefined) {
      continue
    }

    input[key.replaceAll('-', '_')] = value
  }

  return input
}

const validateProfile = (profile: string | undefined, allowedTools: string[], context: string): void => {
  if (!profile) {
    return
  }

  if (profile !== 'free') {
    fail(`--profile only supports "free"`)
  }

  if (allowedTools.length === 0) {
    fail(`--profile is not supported for ${context}`)
  }
}

type ExecuteOptions = {
  toolName: string
  input: Record<string, unknown>
  global: GlobalFlags
  profile?: string
}

const executeTool = async ({ toolName, input, global, profile }: ExecuteOptions): Promise<void> => {
  const headers = profile === 'free' ? undefined : getAuthHeaders(global.apiKey ?? process.env.YDC_API_KEY)
  const url = buildToolUrl({ profile, toolName })

  if (global.dryRun) {
    await writeJson(
      {
        arguments: input,
        headers: sanitizeHeaders(headers),
        tool: toolName,
        url: url.toString(),
      },
      global,
    )
    process.exit(0)
  }

  const result = await withClient(url, headers, (client) => client.callTool({ arguments: input, name: toolName }))

  await writeJson(normalizeToolResult(result), global)
  process.exit(0)
}

export const runSearch = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'search')
  const parsed = parseArgs(argv, [...SEARCH_INPUT_FLAGS, ...GLOBAL_FLAGS, PROFILE_FLAG])
  const global = extractGlobalFlags(parsed.flags)
  const profile = typeof parsed.flags.profile === 'string' ? parsed.flags.profile : undefined
  const toolName = COMMAND_TOOL_MAP.search

  validateProfile(profile, FREE_PROFILE_TOOLS.includes(toolName) ? [toolName] : [], 'search')

  const query = parsed.positionals[0] ?? (await readStdin())

  if (!query) {
    fail('Missing query for search')
  }

  const input = buildInputFromFlags(parsed.flags, SEARCH_INPUT_FLAGS)
  input.query = query

  await executeTool({ global, input, profile, toolName })
}

export const runFetch = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'fetch')
  const parsed = parseArgs(argv, [...FETCH_INPUT_FLAGS, ...GLOBAL_FLAGS])
  const global = extractGlobalFlags(parsed.flags)
  const toolName = COMMAND_TOOL_MAP.fetch

  let urls = parsed.positionals

  if (urls.length === 0) {
    const stdin = await readStdin()
    urls = stdin ? stdin.split(/\s+/u).filter(Boolean) : []
  }

  if (urls.length === 0) {
    fail('Missing URL(s) for fetch')
  }

  const input = buildInputFromFlags(parsed.flags, FETCH_INPUT_FLAGS)
  input.urls = urls

  await executeTool({ global, input, toolName })
}

export const runResearch = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'research')
  await runResearchLike(argv, COMMAND_TOOL_MAP.research)
}

export const runFinanceResearch = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'finance-research')
  await runResearchLike(argv, COMMAND_TOOL_MAP['finance-research'])
}

const runResearchLike = async (argv: string[], toolName: string): Promise<void> => {
  const parsed = parseArgs(argv, [...RESEARCH_INPUT_FLAGS, ...GLOBAL_FLAGS])
  const global = extractGlobalFlags(parsed.flags)
  const inputText = parsed.positionals[0] ?? (await readStdin())

  if (!inputText) {
    fail(`Missing input for ${toolName}`)
  }

  const input: Record<string, unknown> = { input: inputText }

  if (typeof parsed.flags.effort === 'string') {
    input.research_effort = parsed.flags.effort
  }

  await executeTool({ global, input, toolName })
}

export const runRaw = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'raw')
  const parsed = parseArgs(argv, [...GLOBAL_FLAGS, PROFILE_FLAG])
  const global = extractGlobalFlags(parsed.flags)
  const [toolName, jsonInput] = parsed.positionals

  if (!toolName) {
    fail('Missing tool name for raw')
  }

  const tool = TOOL_CONTRACT.tools.find(({ name }) => name === toolName)

  if (!tool) {
    fail(`Unknown tool: ${toolName}`)
  }

  const profile = typeof parsed.flags.profile === 'string' ? parsed.flags.profile : undefined

  validateProfile(profile, tool.supportsFreeProfile ? [toolName] : [], `tool: ${toolName}`)

  const raw = jsonInput ?? (await readStdin())

  if (!raw) {
    fail(`Missing JSON input for tool: ${toolName}`)
  }

  let input: Record<string, unknown>

  try {
    input = JSON.parse(raw) as Record<string, unknown>
  } catch {
    fail(`Invalid JSON input for tool: ${toolName}`)
  }

  await executeTool({ global, input, profile, toolName })
}

export const runSchema = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'schema')
  const parsed = parseArgs(argv, [...GLOBAL_FLAGS, PROFILE_FLAG])
  const global = extractGlobalFlags(parsed.flags)
  const [toolName, target = 'input'] = parsed.positionals

  if (!toolName) {
    fail('Missing tool name for schema')
  }

  const tool = TOOL_CONTRACT.tools.find(({ name }) => name === toolName)

  if (!tool) {
    fail(`Unknown tool: ${toolName}`)
  }

  if (target !== 'input' && target !== 'output') {
    fail(`Unknown schema target: ${target}`)
  }

  const profile = typeof parsed.flags.profile === 'string' ? parsed.flags.profile : undefined

  validateProfile(profile, tool.supportsFreeProfile ? [toolName] : [], `tool: ${toolName}`)

  const headers = profile === 'free' ? undefined : getAuthHeaders(global.apiKey ?? process.env.YDC_API_KEY)
  const url = buildToolUrl({ profile, toolName })
  const schema = await withClient(url, headers, async (client) => {
    const list = await client.listTools()
    const found = list.tools.find(({ name }) => name === toolName)

    if (!found) {
      fail(`Tool ${toolName} is in the local contract but was not advertised by the remote MCP server`)
    }

    const advertised = target === 'input' ? found.inputSchema : found.outputSchema

    if (!advertised) {
      fail(`Tool ${toolName} has no advertised ${target} schema`)
    }

    return advertised
  })

  await writeJson(schema, global)
  process.exit(0)
}

export const runTools = async (argv: string[]): Promise<void> => {
  handleHelp(argv, 'tools')
  const parsed = parseArgs(argv, [
    { kind: 'string', long: '--output', short: '-o' },
    { kind: 'bool', long: '--pretty' },
  ])
  const global: GlobalFlags = {
    dryRun: false,
    output: typeof parsed.flags.output === 'string' ? parsed.flags.output : undefined,
    pretty: parsed.flags.pretty === true,
  }

  await writeJson(
    {
      commands: COMMAND_TOOL_MAP,
      contractHash: TOOL_CONTRACT.contractHash,
      surfaceVersion: TOOL_CONTRACT.surfaceVersion,
      tools: TOOL_CONTRACT.tools.map(({ name }) => name),
    },
    global,
  )
  process.exit(0)
}
