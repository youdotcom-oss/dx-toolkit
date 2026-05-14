import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ToolContractEntry = {
  name: string
  supportsFreeProfile: boolean
}

type ToolContractPayload = {
  surfaceVersion: string
  tools: ToolContractEntry[]
}

const payloadPath = process.argv[2]

if (!payloadPath) {
  throw new Error('Usage: bun scripts/update-cli-tools.ts <payload.json>')
}

const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as Partial<ToolContractPayload>

if (!payload.surfaceVersion || typeof payload.surfaceVersion !== 'string') {
  throw new Error('client_payload.surfaceVersion must be a string')
}

if (!Array.isArray(payload.tools) || payload.tools.length === 0) {
  throw new Error('client_payload.tools must be a non-empty array')
}

const tools = [...payload.tools]
  .map((tool) => {
    if (!tool || typeof tool.name !== 'string' || typeof tool.supportsFreeProfile !== 'boolean') {
      throw new Error('Each tool must include string name and boolean supportsFreeProfile')
    }

    return {
      name: tool.name,
      supportsFreeProfile: tool.supportsFreeProfile,
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

const uniqueToolNames = new Set(tools.map(({ name }) => name))

if (uniqueToolNames.size !== tools.length) {
  throw new Error('Tool names must be unique')
}

const contractHash = createHash('sha256')
  .update(
    JSON.stringify({
      tools,
    }),
  )
  .digest('hex')

const output = `// This file is generated. Do not edit by hand.
export const TOOL_CONTRACT = {
  contractHash: '${contractHash}',
  surfaceVersion: '${payload.surfaceVersion}',
  tools: [
${tools
  .map(
    ({ name, supportsFreeProfile }) => `    {
      name: '${name}',
      supportsFreeProfile: ${supportsFreeProfile},
    },`,
  )
  .join('\n')}
  ],
} as const
`

const outputPath = resolve(import.meta.dir, '..', 'packages', 'cli', 'src', 'tools.ts')

await Bun.write(outputPath, output)
