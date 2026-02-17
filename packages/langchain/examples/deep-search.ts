/**
 * Deep Search Example
 *
 * Demonstrates using the youDeepSearch tool with a LangChain agent
 * for complex research queries requiring in-depth investigation.
 *
 * Usage: bun examples/deep-search.ts
 *
 * Required environment variables:
 *   YDC_API_KEY - You.com API key
 */

import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { createAgent, initChatModel } from 'langchain'
import * as z from 'zod'
import { youDeepSearch } from '../src/main.ts'

// Fetch the You.com API key as an environment variable
// Get a free API key with credits at https://you.com/platform
const apiKey = getEnvironmentVariable('YDC_API_KEY') ?? ''

if (!apiKey) {
  console.error('Error: YDC_API_KEY environment variable is required')
  console.error('Get your API key at: https://you.com/platform/api-keys')
  process.exit(1)
}

// youDeepSearch performs in-depth research on complex queries
// Returns comprehensive answers with inline citations and source URLs
// See our docs at https://docs.you.com/api-reference/deep-search/v1-deep_search for details
const deepSearchTool = youDeepSearch({ apiKey })

// Create a chat model
const model = await initChatModel('claude-haiku-4-5', {
  temperature: 0,
})

// Define the agent's behavior
const systemPrompt = `You are a helpful research assistant that provides detailed analysis.
Synthesize information from deep search results into a clear comparison.
Always cite your sources.`

// Structured response format using Zod schema
const responseFormat = z.object({
  summary: z.string().describe('A detailed summary of the research findings'),
  key_differences: z.array(z.string()).describe('Key differences or findings from the research'),
  sources: z.array(z.string()).describe('The source URLs used in the research'),
})

// Create an agent that combines the model with the deep search tool
const researchAgent = createAgent({
  model,
  tools: [deepSearchTool],
  systemPrompt,
  responseFormat,
})

// Invoke the agent with a complex research question
console.log('Running deep search on a complex research question...\n')

const result = await researchAgent.invoke({
  messages: [
    {
      role: 'user',
      content:
        'What are the key differences between WebAssembly and JavaScript for web development? Provide a detailed comparison.',
    },
  ],
})

console.log('Research Results:')
console.log(result.structuredResponse)

// Direct tool invocation (alternative usage without agent)
// const rawResults = await deepSearchTool.invoke({ query: 'WebAssembly vs JavaScript', search_effort: 'low' })
// console.log(rawResults)
