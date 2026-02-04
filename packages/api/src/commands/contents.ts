import { ContentsQuerySchema } from '../contents/contents.schemas.ts'
import { fetchContents } from '../contents/contents.utils.ts'
import { runCommand } from '../shared/command-runner.ts'
import { buildContentsRequest } from '../shared/dry-run-utils.ts'

export const contentsCommand = async (args: string[]) => {
  await runCommand(args, {
    schema: ContentsQuerySchema,
    handler: ({ input, YDC_API_KEY, getUserAgent }) =>
      fetchContents({ contentsQuery: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({ input, YDC_API_KEY, getUserAgent }) =>
      buildContentsRequest({ contentsQuery: input, YDC_API_KEY, getUserAgent }),
  })
}
