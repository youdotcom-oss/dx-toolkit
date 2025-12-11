import { youContents } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  // Use youContents to extract page content
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      extract: youContents(),
    },
    prompt: 'Extract content from https://modelcontextprotocol.io and summarize what MCP is',
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
};

main().catch(console.error);
