/**
 * Content Extraction Example
 *
 * Demonstrates using the youContents tool with a LangChain agent
 * to extract and analyze web page content.
 *
 * Usage: bun examples/content-extraction.ts
 *
 * Required environment variables:
 *   YDC_API_KEY - You.com API key
 */

import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { createAgent, initChatModel } from 'langchain'
import * as z from 'zod'
import { youContents } from '../src/main.ts'

// Fetch the You.com API key as an environment variable
// Get a free API key with credits at https://you.com/platform
const apiKey = getEnvironmentVariable('YDC_API_KEY') ?? ''

if (!apiKey) {
  console.error('Error: YDC_API_KEY environment variable is required')
  console.error('Get your API key at: https://you.com/platform/api-keys')
  process.exit(1)
}

// youContents extracts full page content from URLs in markdown or HTML format
// See our docs at https://docs.you.com/api-reference/search/contents for details
const contentsTool = youContents({ apiKey })

// Create a chat model
const model = await initChatModel('claude-sonnet-4-6', {
  temperature: 0,
})

// Define the agent's behavior
const systemPrompt = `You are a helpful assistant that analyzes web page content.
Summarize the content and present it clearly.`

// Structured response format using Zod schema
const responseFormat = z.object({
  page_title: z.string().describe('The title or main heading of the page'),
  content_summary: z.string().describe('A summary of the page content'),
  // main_sections: z.array(z.string()).describe('The main sections or topics covered on the page'),
  source_url: z.string().describe('The URL of the page that was fetched'),
})

// Create an agent that combines the model with the contents tool
const contentsAgent = createAgent({
  model,
  tools: [contentsTool],
  systemPrompt,
  responseFormat,
})

// Invoke the agent with a request to fetch page content
console.log('Extracting and analyzing web page content...\n')

const result = await contentsAgent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Get the content from https://www.nbcnews.com and summarize a few headlines.',
      // 'Get the content from https://documentation.you.com/developer-resources/mcp-server and summarize the page.',
    },
  ],
})

console.log('Page Content Analysis:')
console.log(result.structuredResponse)

// Direct tool invocation (alternative usage without agent)
// const rawContent = await contentsTool.invoke({ urls: ['https://cnn.com'], formats: ['markdown'] })
// console.log(rawContent)
