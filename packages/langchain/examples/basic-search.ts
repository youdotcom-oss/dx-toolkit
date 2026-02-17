/**
 * Basic Search Example
 *
 * Demonstrates using the youSearch tool with a LangChain agent
 * to search the web and return structured results.
 *
 * Usage: bun examples/basic-search.ts
 *
 * Required environment variables:
 *   YDC_API_KEY - You.com API key
 */

import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { createAgent, initChatModel } from 'langchain'
import * as z from 'zod'
import { youSearch } from '../src/main.ts'

// Fetch the You.com API key as an environment variable
// Get a free API key with credits at https://you.com/platform
const apiKey = getEnvironmentVariable('YDC_API_KEY') ?? ''

if (!apiKey) {
  console.error('Error: YDC_API_KEY environment variable is required')
  console.error('Get your API key at: https://you.com/platform/api-keys')
  process.exit(1)
}

// youSearch performs web searches and returns titles, URLs, and snippets
// See our docs at https://docs.you.com/api-reference/search/v1-search for details
const searchTool = youSearch({ apiKey })

// Create a chat model
const model = await initChatModel('claude-haiku-4-5', {
  temperature: 0,
})

// Define the agent's behavior
const systemPrompt = `You are a helpful assistant that summarizes search results.
Be concise and informative. Always cite your sources.`

// Structured response format using Zod schema
const responseFormat = z.object({
  summary: z.string().describe('A concise summary of the search results'),
  key_points: z.array(z.string()).describe('Key points from the search results'),
  urls: z.array(z.string()).describe('The source URLs from the search results'),
})

// Create an agent that combines the model with the search tool
const searchAgent = createAgent({
  model,
  tools: [searchTool],
  systemPrompt,
  responseFormat,
})

// Invoke the agent with a search query
console.log('Searching for the latest developments in AI...\n')

const result = await searchAgent.invoke({
  messages: [{ role: 'user', content: 'What are the latest developments in AI?' }],
})

console.log('Search Results Summary:')
console.log(result.structuredResponse)

// Direct tool invocation (alternative usage without agent)
// const rawResults = await searchTool.invoke({ query: 'AI news', count: 5 })
// console.log(rawResults)
