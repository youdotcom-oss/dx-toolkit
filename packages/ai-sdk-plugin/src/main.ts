import { createMCPClient } from '@ai-sdk/mcp'

export type YouToolsConfig = {
  apiKey?: string
  tools?: string | string[]
  profile?: string
}

export const youTools = async ({ apiKey = process.env.YDC_API_KEY, tools, profile }: YouToolsConfig = {}) => {
  const url = new URL('https://api.you.com/mcp')
  if (profile) {
    url.searchParams.set('profile', profile)
  } else if (tools) {
    url.searchParams.set('tools', Array.isArray(tools) ? tools.join(',') : tools)
  }

  const client = await createMCPClient({
    transport: {
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : undefined,
      type: 'http',
      url: url.href,
    },
  })

  return await client.tools()
}
