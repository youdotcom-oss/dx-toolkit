export type FlagKind = 'bool' | 'string' | 'int' | 'csv'

export type FlagSpec = {
  long: string
  short?: string
  kind: FlagKind
}

export type FlagValues = Record<string, boolean | string | number | string[] | undefined>

export type ParseResult = {
  positionals: string[]
  flags: FlagValues
}

export type GlobalFlags = {
  apiKey?: string
  dryRun: boolean
  output?: string
  pretty: boolean
}

function failParse(message: string): never {
  console.error(message)
  process.exit(1)
}

export const parseArgs = (argv: string[], specs: FlagSpec[]): ParseResult => {
  const byLong = new Map<string, FlagSpec>()
  const byShort = new Map<string, FlagSpec>()

  for (const spec of specs) {
    byLong.set(spec.long, spec)

    if (spec.short) {
      byShort.set(spec.short, spec)
    }
  }

  const positionals: string[] = []
  const flags: FlagValues = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === undefined) {
      break
    }

    if (!token.startsWith('-') || token === '-') {
      positionals.push(token)
      continue
    }

    let name = token
    let inlineValue: string | undefined
    const equalsIndex = token.indexOf('=')

    if (equalsIndex !== -1) {
      name = token.slice(0, equalsIndex)
      inlineValue = token.slice(equalsIndex + 1)
    }

    const spec = byLong.get(name) ?? byShort.get(name)

    if (!spec) {
      failParse(`Unknown flag: ${name}`)
    }

    const key = spec.long.replace(/^--/, '')

    if (spec.kind === 'bool') {
      if (inlineValue !== undefined) {
        failParse(`Flag does not accept a value: ${name}`)
      }

      flags[key] = true
      continue
    }

    let rawValue: string | undefined = inlineValue

    if (rawValue === undefined) {
      const next = argv[index + 1]

      if (next === undefined || (next.startsWith('-') && next !== '-')) {
        failParse(`Missing value for ${name}`)
      }

      rawValue = next
      index += 1
    }

    if (spec.kind === 'int') {
      const parsed = Number.parseInt(rawValue, 10)

      if (Number.isNaN(parsed) || String(parsed) !== rawValue.trim()) {
        failParse(`Invalid integer for ${name}: ${rawValue}`)
      }

      flags[key] = parsed
      continue
    }

    if (spec.kind === 'csv') {
      flags[key] = rawValue
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
      continue
    }

    flags[key] = rawValue
  }

  return { flags, positionals }
}
