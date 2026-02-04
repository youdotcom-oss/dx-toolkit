import { ExpressAgentInputSchema } from '../express/express.schemas.ts'
import { callExpressAgent } from '../express/express.utils.ts'
import { runCommand } from '../shared/command-runner.ts'
import { buildExpressRequest } from '../shared/dry-run-utils.ts'

export const expressCommand = async (args: string[]) => {
  await runCommand(args, {
    schema: ExpressAgentInputSchema,
    handler: ({ input, YDC_API_KEY, getUserAgent }) =>
      callExpressAgent({ agentInput: input, YDC_API_KEY, getUserAgent }),
    dryRunHandler: ({ input, YDC_API_KEY, getUserAgent }) =>
      buildExpressRequest({ agentInput: input, YDC_API_KEY, getUserAgent }),
  })
}
