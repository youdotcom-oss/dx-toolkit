/**
 * Multi-Tool Agent Example
 *
 * Demonstrates chaining youSearch and youContents in a single LangChain agent:
 *   1. Search for recent articles about sustainable energy
 *   2. Extract content from the top result
 *   3. Summarize key points from the article
 *
 * Usage: bun examples/multi-tool-agent.ts
 *
 * Required environment variables:
 *   YDC_API_KEY - You.com API key
 */

import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { createAgent, initChatModel } from 'langchain'
import * as z from 'zod'
import { youContents, youSearch } from '../src/main.ts'

// Fetch the You.com API key as an environment variable
// Get a free API key with credits at https://you.com/platform
const apiKey = getEnvironmentVariable('YDC_API_KEY') ?? ''

if (!apiKey) {
  console.error('Error: YDC_API_KEY environment variable is required')
  console.error('Get your API key at: https://you.com/platform/api-keys')
  process.exit(1)
}

// Step 1 tool: youSearch finds relevant articles and returns titles, URLs, and snippets
const searchTool = youSearch({ apiKey })

// Step 2 tool: youContents extracts full page content from a URL in markdown format
const contentsTool = youContents({ apiKey })

// Create a chat model
const model = await initChatModel('claude-haiku-4-5', {
  temperature: 0,
})

// The system prompt defines the tool-chaining workflow:
// search (find articles) -> contents (extract text) -> summarize
const systemPrompt = `You are a helpful research assistant. Follow these steps exactly:
1. Use the search tool to find recent articles about the user's topic
2. Take the URL of the first search result
3. Summarize the key points from the article`

// Structured response format using Zod schema
const responseFormat = z.object({
  source_url: z.string().describe('The URL of the article that was fetched'),
  title: z.string().describe('The title of the article'),
  summary: z.string().describe("A concise summary of the article's main points"),
})

// Create an agent with both tools — the agent chains them based on the system prompt
const researchAgent = createAgent({
  model,
  tools: [searchTool, contentsTool],
  systemPrompt,
  responseFormat,
})

// Run the agent: search -> extract -> summarize
console.log('Running multi-tool research agent...\n')
console.log('Tool chain: youSearch -> youContents -> summarize')
console.log('  1. Searching for recent articles about sustainable energy')
console.log('  2. Extracting content from the top result')
console.log('  3. Summarizing key points from the article\n')

const result = await researchAgent.invoke(
  {
    messages: [
      {
        role: 'user',
        content:
          "What's the latest news about sustainable energy? Get the first URL from the search results use that to fill out the rest of the info.",
      },
    ],
  },
  { recursionLimit: 10 },
)

console.log('Source URL:', result.structuredResponse.source_url)
console.log('Title:', result.structuredResponse.title)
console.log('\n--- Summary ---\n')
console.log(result.structuredResponse.summary)
