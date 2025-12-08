import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  const { tools, close } = await createYouMCPClient({
    apiKey: process.env.YDC_API_KEY,
  });

  try {
    // Use you-contents tool to extract page content
    const result = await generateText({
      model: 'anthropic/claude-sonnet-4.5',
      tools: tools as any,
      prompt:
        'Use the you-contents tool to extract content from https://modelcontextprotocol.io and summarize what MCP is',
    });

    console.log('Extracted and summarized:', result.text);

    // Show tool usage
    if (result.toolCalls.length > 0) {
      console.log('\nTool execution details:');
      for (const toolCall of result.toolCalls) {
        console.log(`\nTool: ${toolCall.toolName}`);
        if ('input' in toolCall) {
          console.log('Input:', JSON.stringify(toolCall.input, null, 2));
        }
      }
    }

    if (result.toolResults.length > 0) {
      console.log('\nTool results received:', result.toolResults.length);
    }
  } finally {
    await close();
  }
};

main().catch(console.error);
