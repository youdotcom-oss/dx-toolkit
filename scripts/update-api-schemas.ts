import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'
const DEFAULT_OUTPUT_PATH = resolve(import.meta.dir, '..', 'packages', 'api', 'src', 'tool-schemas.ts')
const BIOME_BIN = resolve(import.meta.dir, '..', 'node_modules', '.bin', 'biome')

type JsonSchema = boolean | JsonSchemaObject

type JsonSchemaObject = {
  $defs?: Record<string, JsonSchema>
  $ref?: string
  additionalProperties?: boolean | JsonSchema
  allOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  const?: unknown
  enum?: unknown[]
  items?: JsonSchema
  oneOf?: JsonSchema[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  type?: string | string[]
}

type ToolSchema = {
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
}

type ToolSchemaPayload = Record<string, ToolSchema>

const knownTools = ['you-balance', 'you-contents', 'you-research', 'you-search'] as const

const toTypeScriptString = (value: string) => `'${JSON.stringify(value).slice(1, -1).replaceAll("'", "\\'")}'`

const toPropertyKey = (value: string) => (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value) ? value : toTypeScriptString(value))

const toTypeName = (toolName: string, suffix: 'Input' | 'Output') =>
  `${toolName
    .split('-')
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join('')}${suffix}`

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

const formatObjectLiteral = (value: unknown, depth = 0): string => {
  const indent = '  '.repeat(depth)
  const nextIndent = '  '.repeat(depth + 1)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'

    return `[
${value.map((item) => `${nextIndent}${formatObjectLiteral(item, depth + 1)},`).join('\n')}
${indent}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    if (entries.length === 0) return '{}'

    return `{
${entries.map(([key, nestedValue]) => `${nextIndent}${toPropertyKey(key)}: ${formatObjectLiteral(nestedValue, depth + 1)},`).join('\n')}
${indent}}`
  }

  return JSON.stringify(value)
}

const getSchemaObject = (schema: JsonSchema): JsonSchemaObject => {
  if (schema === true) return {}
  if (schema === false) return { const: undefined }

  return schema
}

const literalType = (value: unknown): string => {
  if (value === null) return 'null'
  if (typeof value === 'string') return toTypeScriptString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value)

  throw new Error(`Unsupported JSON Schema literal: ${JSON.stringify(value)}`)
}

const schemaToType = (schema: JsonSchema | undefined, rootSchema: JsonSchemaObject = {}): string => {
  if (!schema || schema === true) return 'unknown'
  if (schema === false) return 'never'

  if (schema.$ref) {
    const refPrefix = '#/$defs/'
    if (!schema.$ref.startsWith(refPrefix)) {
      throw new Error(`Unsupported JSON Schema ref: ${schema.$ref}`)
    }

    const definition = rootSchema.$defs?.[schema.$ref.slice(refPrefix.length)]
    if (!definition) {
      throw new Error(`Missing JSON Schema ref target: ${schema.$ref}`)
    }

    return schemaToType(definition, rootSchema)
  }

  if ('const' in schema) return literalType(schema.const)
  if (schema.enum) return schema.enum.map(literalType).join(' | ')
  if (schema.oneOf) return schema.oneOf.map((item) => schemaToType(item, rootSchema)).join(' | ')
  if (schema.anyOf) return schema.anyOf.map((item) => schemaToType(item, rootSchema)).join(' | ')
  if (schema.allOf) return schema.allOf.map((item) => `(${schemaToType(item, rootSchema)})`).join(' & ')

  if (Array.isArray(schema.type)) {
    return schema.type.map((type) => schemaToType({ ...schema, type }, rootSchema)).join(' | ')
  }

  switch (schema.type) {
    case 'array':
      return `Array<${schemaToType(schema.items, rootSchema)}>`
    case 'boolean':
      return 'boolean'
    case 'integer':
    case 'number':
      return 'number'
    case 'null':
      return 'null'
    case 'object':
    case undefined:
      return objectSchemaToType(schema, rootSchema)
    case 'string':
      return 'string'
    default:
      throw new Error(`Unsupported JSON Schema type: ${schema.type}`)
  }
}

const objectSchemaToType = (schema: JsonSchemaObject, rootSchema: JsonSchemaObject) => {
  const properties = Object.entries(schema.properties ?? {}).sort(([left], [right]) => left.localeCompare(right))
  const required = new Set(schema.required ?? [])
  const members = properties.map(
    ([key, value]) => `${toPropertyKey(key)}${required.has(key) ? '' : '?'}: ${schemaToType(value, rootSchema)}`,
  )

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    members.push(`[key: string]: ${schemaToType(schema.additionalProperties, rootSchema)}`)
  } else if (properties.length === 0 && schema.additionalProperties !== false) {
    return 'Record<string, unknown>'
  }

  return members.length === 0 ? '{}' : `{\n${members.map((member) => `  ${member}`).join('\n')}\n}`
}

const getValidatedPayload = (payload: ToolSchemaPayload) => {
  const validatedPayload: ToolSchemaPayload = {}

  for (const toolName of Object.keys(payload).sort()) {
    if (!knownTools.includes(toolName as (typeof knownTools)[number])) {
      continue
    }

    const tool = payload[toolName]

    if (!tool?.inputSchema) {
      throw new Error(`Tool ${toolName} is missing inputSchema`)
    }

    validatedPayload[toolName] = {
      inputSchema: getSchemaObject(tool.inputSchema),
      outputSchema: tool.outputSchema ? getSchemaObject(tool.outputSchema) : {},
    }
  }

  for (const toolName of knownTools) {
    if (!validatedPayload[toolName]) {
      throw new Error(`Missing expected hosted tool: ${toolName}`)
    }
  }

  return validatedPayload
}

export const renderApiSchemas = (payload: ToolSchemaPayload) => {
  const validatedPayload = getValidatedPayload(payload)
  const toolNames = Object.keys(validatedPayload).sort()
  const schemaHash = createHash('sha256').update(stableStringify(validatedPayload)).digest('hex')
  const typeDeclarations = toolNames
    .flatMap((toolName) => {
      const tool = validatedPayload[toolName]
      const inputName = toTypeName(toolName, 'Input')
      const outputName = toTypeName(toolName, 'Output')

      return [
        `export type ${inputName} = ${schemaToType(tool.inputSchema, getSchemaObject(tool.inputSchema))}`,
        `export type ${outputName} = ${schemaToType(tool.outputSchema, getSchemaObject(tool.outputSchema ?? {}))}`,
      ]
    })
    .join('\n\n')
  const inputMap = toolNames
    .map((toolName) => `  ${toTypeScriptString(toolName)}: ${toTypeName(toolName, 'Input')}`)
    .join('\n')
  const outputMap = toolNames
    .map((toolName) => `  ${toTypeScriptString(toolName)}: ${toTypeName(toolName, 'Output')}`)
    .join('\n')

  return `// This file is generated. Do not edit by hand.
export const API_TOOL_SCHEMA_HASH = ${toTypeScriptString(schemaHash)}

export const API_TOOL_SCHEMAS = ${formatObjectLiteral(validatedPayload)} as const

${typeDeclarations}

export type KnownToolName = keyof typeof API_TOOL_SCHEMAS

type KnownToolInputMap = {
${inputMap}
}

type KnownToolOutputMap = {
${outputMap}
}

export type KnownToolInput<T extends KnownToolName> = KnownToolInputMap[T]

export type KnownToolOutput<T extends KnownToolName> = KnownToolOutputMap[T]
`
}

const formatGeneratedSource = async (source: string) => {
  const tempDir = mkdtempSync(join(tmpdir(), 'api-schemas-'))
  const tempFile = join(tempDir, 'tool-schemas.ts')

  try {
    await Bun.write(tempFile, source)

    const result = Bun.spawnSync({
      cmd: [BIOME_BIN, 'format', '--write', tempFile],
      stderr: 'pipe',
      stdout: 'pipe',
    })

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.toString())
    }

    return await Bun.file(tempFile).text()
  } finally {
    rmSync(tempDir, { force: true, recursive: true })
  }
}

const fetchApiSchemas = async (): Promise<ToolSchemaPayload> => {
  const apiKey = process.env.YDC_API_KEY
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  const transport = new StreamableHTTPClientTransport(new URL(BASE_MCP_SERVER_URL), {
    requestInit: {
      headers,
    },
  })
  const client = new Client({
    name: 'dx-toolkit-schema-generator',
    version: '0.0.0',
  })

  try {
    await client.connect(transport)
    const { tools } = await client.listTools()

    return Object.fromEntries(
      tools.map(({ inputSchema, name, outputSchema }) => [
        name,
        {
          inputSchema: inputSchema as JsonSchema,
          outputSchema: outputSchema as JsonSchema | undefined,
        },
      ]),
    )
  } finally {
    await Promise.allSettled([client.close(), transport.close()])
  }
}

if (import.meta.main) {
  const checkOnly = process.argv.includes('--check')
  const outputPath = DEFAULT_OUTPUT_PATH
  const payload = getValidatedPayload(await fetchApiSchemas())
  const rendered = await formatGeneratedSource(renderApiSchemas(payload))
  const current = await Bun.file(outputPath)
    .exists()
    .then((exists) => (exists ? Bun.file(outputPath).text() : ''))

  if (checkOnly) {
    if (current !== rendered) {
      process.stdout.write('changed\n')
      process.exit(1)
    }

    process.stdout.write('none\n')
    process.exit(0)
  }

  await Bun.write(outputPath, rendered)
  process.stdout.write('updated\n')
}
