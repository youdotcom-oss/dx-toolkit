import { DeepSearchQuerySchema } from '../deep-search/deep-search.schemas.ts'
import { callDeepSearch } from '../deep-search/deep-search.utils.ts'
import { runCommand } from '../shared/command-runner.ts'
import { buildDeepSearchRequest } from '../shared/dry-run-utils.ts'

export const deepSearchCommand = async (args: string[]) => {
  await runCommand(args, {
    schema: DeepSearchQuerySchema,
    handler: ({ input, YDC_API_KEY, getUserAgent }) =>
      callDeepSearch({ deepSearchQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({ input, YDC_API_KEY, getUserAgent }) =>
      buildDeepSearchRequest({ deepSearchQuery: input, YDC_API_KEY, getUserAgent }),
  })
}
