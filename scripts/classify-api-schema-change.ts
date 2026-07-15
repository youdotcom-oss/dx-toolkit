import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const BASE_MCP_SERVER_URL = 'https://api.you.com/mcp'
const DEFAULT_SCHEMA_PATH = resolve(import.meta.dir, '..', 'packages', 'api', 'src', 'tool-schemas.ts')
const knownTools = ['you-contents', 'you-research', 'you-search'] as const

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

export type ToolSchemaPayload = Record<string, ToolSchema>

export type ChangeLevel = 'major' | 'minor' | 'patch'

type SchemaSurface = 'input' | 'output'

const metadataKeys = new Set([
  '$schema',
  'default',
  'description',
  'examples',
  'maximum',
  'maxLength',
  'maxItems',
  'minimum',
  'minLength',
  'minItems',
  'title',
])

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

const semanticSchema = (schema: unknown): unknown => {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  if (Array.isArray(schema)) {
    return schema.map(semanticSchema)
  }

  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => !metadataKeys.has(key))
      .map(([key, value]) => [
        key,
        key === 'enum' && Array.isArray(value) ? uniqueEnumValues(value) : semanticSchema(value),
      ]),
  )
}

const uniqueEnumValues = (values: unknown[]) =>
  [...new Map(values.map((value) => [stableStringify(value), value])).values()].sort((left, right) =>
    stableStringify(left).localeCompare(stableStringify(right)),
  )

const getSchemaObject = (schema: JsonSchema): JsonSchemaObject => {
  if (schema === true) return {}
  if (schema === false) return { type: undefined }

  return schema
}

const maxChangeLevel = (left: ChangeLevel, right: ChangeLevel): ChangeLevel => {
  if (left === 'major' || right === 'major') return 'major'
  if (left === 'minor' || right === 'minor') return 'minor'

  return 'patch'
}

const isEnumWidening = (previousSchema: JsonSchemaObject, nextSchema: JsonSchemaObject) => {
  if (!previousSchema.enum || !nextSchema.enum) {
    return false
  }

  const previousValues = new Set(previousSchema.enum.map(stableStringify))
  const nextValues = new Set(nextSchema.enum.map(stableStringify))

  return (
    previousSchema.enum.every((value) => nextValues.has(stableStringify(value))) &&
    nextValues.size > previousValues.size
  )
}

const classifyAdditionalPropertiesChange = (
  previousSchema: JsonSchemaObject,
  nextSchema: JsonSchemaObject,
  surface: SchemaSurface,
): ChangeLevel => {
  const previousAdditionalProperties = previousSchema.additionalProperties
  const nextAdditionalProperties = nextSchema.additionalProperties

  if (
    stableStringify(semanticSchema(previousAdditionalProperties)) ===
    stableStringify(semanticSchema(nextAdditionalProperties))
  ) {
    return 'patch'
  }

  if (nextAdditionalProperties === false && previousAdditionalProperties !== false) {
    return 'major'
  }

  if (previousAdditionalProperties === false && nextAdditionalProperties !== false) {
    return 'minor'
  }

  if (previousAdditionalProperties && typeof previousAdditionalProperties === 'object') {
    if (nextAdditionalProperties && typeof nextAdditionalProperties === 'object') {
      return classifyJsonSchemaChange(
        getSchemaObject(previousAdditionalProperties),
        getSchemaObject(nextAdditionalProperties),
        surface,
      )
    }

    return 'minor'
  }

  if (nextAdditionalProperties && typeof nextAdditionalProperties === 'object') {
    return 'major'
  }

  return 'major'
}

const classifyObjectSchemaChange = (
  previousSchema: JsonSchemaObject,
  nextSchema: JsonSchemaObject,
  surface: SchemaSurface,
): ChangeLevel => {
  const previousProperties = previousSchema.properties ?? {}
  const nextProperties = nextSchema.properties ?? {}
  const previousRequired = new Set(previousSchema.required ?? [])
  const nextRequired = new Set(nextSchema.required ?? [])
  let changeLevel = classifyAdditionalPropertiesChange(previousSchema, nextSchema, surface)

  for (const propertyName of Object.keys(previousProperties)) {
    if (!(propertyName in nextProperties)) {
      return 'major'
    }

    if (surface === 'input' && !previousRequired.has(propertyName) && nextRequired.has(propertyName)) {
      return 'major'
    }

    if (surface === 'output' && previousRequired.has(propertyName) && !nextRequired.has(propertyName)) {
      return 'major'
    }

    if (surface === 'input' && previousRequired.has(propertyName) && !nextRequired.has(propertyName)) {
      changeLevel = maxChangeLevel(changeLevel, 'minor')
    }

    if (surface === 'output' && !previousRequired.has(propertyName) && nextRequired.has(propertyName)) {
      changeLevel = maxChangeLevel(changeLevel, 'minor')
    }

    changeLevel = maxChangeLevel(
      changeLevel,
      classifyJsonSchemaChange(
        getSchemaObject(previousProperties[propertyName] ?? {}),
        getSchemaObject(nextProperties[propertyName] ?? {}),
        surface,
      ),
    )
  }

  for (const propertyName of Object.keys(nextProperties)) {
    if (!(propertyName in previousProperties)) {
      if (surface === 'input' && nextRequired.has(propertyName)) {
        return 'major'
      }

      changeLevel = maxChangeLevel(changeLevel, 'minor')
    }
  }

  return changeLevel
}

const classifyJsonSchemaChange = (
  previousSchema: JsonSchemaObject,
  nextSchema: JsonSchemaObject,
  surface: SchemaSurface,
): ChangeLevel => {
  if (stableStringify(semanticSchema(previousSchema)) === stableStringify(semanticSchema(nextSchema))) {
    return 'patch'
  }

  if (previousSchema.type !== nextSchema.type) {
    return 'major'
  }

  if (isEnumWidening(previousSchema, nextSchema)) {
    return 'minor'
  }

  if (
    (previousSchema.type === 'object' || previousSchema.properties) &&
    (nextSchema.type === 'object' || nextSchema.properties)
  ) {
    return classifyObjectSchemaChange(previousSchema, nextSchema, surface)
  }

  if (previousSchema.type === 'array' && nextSchema.type === 'array') {
    return classifyJsonSchemaChange(
      getSchemaObject(previousSchema.items ?? {}),
      getSchemaObject(nextSchema.items ?? {}),
      surface,
    )
  }

  return 'major'
}

export const classifySchemaChange = (
  previousPayload: ToolSchemaPayload | undefined,
  nextPayload: ToolSchemaPayload,
): ChangeLevel => {
  if (!previousPayload) return 'minor'

  const previousTools = new Set(Object.keys(previousPayload))
  const nextTools = new Set(Object.keys(nextPayload))

  for (const toolName of previousTools) {
    if (!nextTools.has(toolName)) return 'major'
  }

  let changeLevel: ChangeLevel = 'patch'

  for (const [toolName, nextTool] of Object.entries(nextPayload)) {
    const previousTool = previousPayload[toolName]

    if (!previousTool) {
      changeLevel = maxChangeLevel(changeLevel, 'minor')
      continue
    }

    const inputChange = classifyJsonSchemaChange(
      getSchemaObject(previousTool.inputSchema),
      getSchemaObject(nextTool.inputSchema),
      'input',
    )
    const outputChange = classifyJsonSchemaChange(
      getSchemaObject(previousTool.outputSchema ?? {}),
      getSchemaObject(nextTool.outputSchema ?? {}),
      'output',
    )

    changeLevel = maxChangeLevel(changeLevel, maxChangeLevel(inputChange, outputChange))

    if (changeLevel === 'major') return 'major'
  }

  return changeLevel
}

export const readCurrentPayload = (schemaPath: string): ToolSchemaPayload | undefined => {
  try {
    const source = readFileSync(schemaPath, 'utf8')
    const match = source.match(/export const API_TOOL_SCHEMAS = ([\s\S]*?) as const\n/)

    if (!match?.[1]) return undefined

    return JSON.parse(toJsonObjectLiteral(match[1])) as ToolSchemaPayload
  } catch {
    return undefined
  }
}

const toJsonObjectLiteral = (source: string) =>
  convertSingleQuotedStrings(quoteUnquotedKeys(source)).replace(/,\s*([}\]])/g, '$1')

const quoteUnquotedKeys = (source: string) => {
  let output = ''
  let index = 0

  while (index < source.length) {
    const character = source[index]

    if (character === "'") {
      const { nextIndex, text } = readSingleQuotedString(source, index)

      output += text
      index = nextIndex
      continue
    }

    if (character !== '{' && character !== ',') {
      output += character
      index += 1
      continue
    }

    output += character
    index += 1

    while (/\s/.test(source[index] ?? '')) {
      output += source[index]
      index += 1
    }

    if (!/[$A-Z_a-z]/.test(source[index] ?? '')) {
      continue
    }

    const keyStart = index
    index += 1

    while (/[$\w]/.test(source[index] ?? '')) {
      index += 1
    }

    const key = source.slice(keyStart, index)
    let whitespace = ''

    while (/\s/.test(source[index] ?? '')) {
      whitespace += source[index]
      index += 1
    }

    if (source[index] === ':') {
      output += `${JSON.stringify(key)}${whitespace}`
      continue
    }

    output += `${key}${whitespace}`
  }

  return output
}

const convertSingleQuotedStrings = (source: string) => {
  let output = ''

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== "'") {
      output += source[index]
      continue
    }

    const { nextIndex, rawString } = readSingleQuotedString(source, index)
    index = nextIndex - 1

    const jsonString = `"${rawString.replaceAll('"', '\\"').replaceAll("\\'", "'")}"`
    output += JSON.stringify(JSON.parse(jsonString))
  }

  return output
}

const readSingleQuotedString = (source: string, startIndex: number) => {
  let rawString = ''
  let text = "'"
  let index = startIndex + 1

  for (; index < source.length; index += 1) {
    const character = source[index]

    if (character === '\\') {
      const escapedCharacter = source[index + 1] ?? ''

      rawString += `${character}${escapedCharacter}`
      text += `${character}${escapedCharacter}`
      index += 1
      continue
    }

    text += character

    if (character === "'") {
      index += 1
      break
    }

    rawString += character
  }

  return { nextIndex: index, rawString, text }
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

const fetchApiSchemas = async (): Promise<ToolSchemaPayload> => {
  const apiKey = process.env.YDC_API_KEY
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  const transport = new StreamableHTTPClientTransport(new URL(BASE_MCP_SERVER_URL), {
    requestInit: {
      headers,
    },
  })
  const client = new Client({
    name: 'dx-toolkit-schema-classifier',
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
  const payload = getValidatedPayload(await fetchApiSchemas())
  const changeLevel = classifySchemaChange(readCurrentPayload(DEFAULT_SCHEMA_PATH), payload)

  process.stdout.write(`${changeLevel}\n`)
}
