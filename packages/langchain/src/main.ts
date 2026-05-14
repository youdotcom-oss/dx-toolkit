import { MultiServerMCPClient } from '@langchain/mcp-adapters'

export type YouClientConfig = {
  apiKey?: string
  tools?: string | string[]
  profile?: string
}

export const createYouClient = async ({ apiKey = process.env.YDC_API_KEY, tools, profile }: YouClientConfig = {}) => {
  const url = new URL('https://api.you.com/mcp')
  if (profile) {
    url.searchParams.set('profile', profile)
  } else if (tools) {
    url.searchParams.set('tools', Array.isArray(tools) ? tools.join(',') : tools)
  }
  return new MultiServerMCPClient({
    mcpServers: {
      you: {
        headers: apiKey
          ? {
              Authorization: `Bearer ${apiKey}`,
            }
          : undefined,
        transport: 'http',
        url: url.href,
      },
    },
  })
}
