/**
 * Generates CLI help text from a JSON Schema object
 * Introspects properties, types, constraints, and descriptions
 *
 * @internal
 */

type JsonSchemaProperty = {
  type?: string
  description?: string
  enum?: string[]
  minimum?: number
  maximum?: number
  default?: unknown
  items?: { type?: string; enum?: string[] }
}

const asProperty = (value: unknown): JsonSchemaProperty => {
  if (typeof value === 'object' && value !== null) {
    return value as JsonSchemaProperty
  }
  return {}
}

const MAX_ENUM_DISPLAY = 5

const formatEnum = (values: string[]): string => {
  if (values.length <= MAX_ENUM_DISPLAY) {
    return values.join(' | ')
  }
  return `${values.slice(0, 3).join(' | ')} ...+${values.length - 3} more`
}

const formatType = (prop: JsonSchemaProperty): string => {
  if (prop.enum) {
    return formatEnum(prop.enum)
  }
  if (prop.type === 'array' && prop.items) {
    if (prop.items.enum) {
      return `(${formatEnum(prop.items.enum)})[]`
    }
    return `${prop.items.type || 'unknown'}[]`
  }
  return prop.type || 'unknown'
}

const formatConstraints = (prop: JsonSchemaProperty): string => {
  const parts: string[] = []
  if (prop.minimum !== undefined && prop.maximum !== undefined) {
    parts.push(`${prop.minimum}-${prop.maximum}`)
  } else if (prop.minimum !== undefined) {
    parts.push(`>=${prop.minimum}`)
  } else if (prop.maximum !== undefined) {
    parts.push(`<=${prop.maximum}`)
  }
  if (prop.default !== undefined) {
    parts.push(`default: ${JSON.stringify(prop.default)}`)
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : ''
}

/**
 * Generate formatted help text from a JSON Schema
 *
 * @param jsonSchema - JSON Schema object (from z.toJSONSchema())
 * @param commandName - Command name for the header
 * @param description - Command description
 * @returns Formatted help string
 *
 * @internal
 */
export const generateCommandHelp = ({
  jsonSchema,
  commandName,
  description,
}: {
  jsonSchema: Record<string, unknown>
  commandName: string
  description?: string
}): string => {
  const lines: string[] = []

  lines.push(`ydc ${commandName}`)
  if (description) {
    lines.push(description)
  }
  lines.push('')
  lines.push('Input Parameters (JSON):')

  const properties = (jsonSchema.properties || {}) as Record<string, unknown>
  const required = new Set((jsonSchema.required as string[]) || [])

  // Calculate column widths for alignment
  const entries = Object.entries(properties).map(([name, rawProp]) => {
    const prop = asProperty(rawProp)
    const nameCol = `  ${name}${required.has(name) ? '*' : ''}`
    const typeCol = formatType(prop)
    const descCol = (prop.description || '') + formatConstraints(prop)
    return { nameCol, typeCol, descCol }
  })

  const maxNameWidth = Math.max(...entries.map((e) => e.nameCol.length), 0)
  const maxTypeWidth = Math.max(...entries.map((e) => e.typeCol.length), 0)

  for (const { nameCol, typeCol, descCol } of entries) {
    const paddedName = nameCol.padEnd(maxNameWidth + 2)
    const paddedType = typeCol.padEnd(maxTypeWidth + 2)
    lines.push(`${paddedName}${paddedType}${descCol}`)
  }

  lines.push('')
  lines.push('* = required')

  return lines.join('\n')
}
