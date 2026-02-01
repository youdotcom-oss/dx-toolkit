import { parseArgs } from 'node:util'
import * as z from 'zod'
import { SearchQuerySchema } from '../search/search.schemas.ts'
import { fetchSearchResults } from '../search/search.utils.ts'
import { useGetUserAgent } from '../shared/use-get-user-agents.ts'

export const searchCommand = async (args: string[]) => {
  // Handle --schema flag
  if (args.includes('--schema')) {
    console.log(JSON.stringify(z.toJSONSchema(SearchQuerySchema)))
    process.exit(0)
  }

  // Parse flags with Node's built-in parseArgs
  const { values } = parseArgs({
    args,
    options: {
      json: { type: 'string' },
      'api-key': { type: 'string' },
      client: { type: 'string' },
    },
  })

  // --json is required
  if (!values.json) {
    throw new Error('--json flag is required')
  }

  // Parse JSON and validate with schema
  const query = JSON.parse(values.json)
  const apiKey = values['api-key']
  const client = values.client || process.env.YDC_CLIENT

  // Get API key from options or environment
  const YDC_API_KEY = apiKey || process.env.YDC_API_KEY
  if (!YDC_API_KEY) {
    throw new Error('YDC_API_KEY environment variable is required')
  }

  // Validate with schema (includes query validation)
  const searchQuery = SearchQuerySchema.parse(query)

  // Fetch results
  const response = await fetchSearchResults({
    searchQuery,
    YDC_API_KEY,
    getUserAgent: useGetUserAgent(client),
  })

  // Output response to stdout (success)
  console.log(JSON.stringify(response))
}
