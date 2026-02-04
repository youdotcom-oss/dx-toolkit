import { SearchQuerySchema } from '../search/search.schemas.ts'
import { fetchSearchResults } from '../search/search.utils.ts'
import { runCommand } from '../shared/command-runner.ts'
import { buildSearchRequest } from '../shared/dry-run-utils.ts'

export const searchCommand = async (args: string[]) => {
  await runCommand(args, {
    schema: SearchQuerySchema,
    handler: ({ input, YDC_API_KEY, getUserAgent }) =>
      fetchSearchResults({ searchQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({ input, YDC_API_KEY, getUserAgent }) =>
      buildSearchRequest({ searchQuery: input, YDC_API_KEY, getUserAgent }),
  })
}
