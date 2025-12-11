import { youExpress } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  // Use youExpress for fast AI agent responses with web search
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      agent: youExpress(),
    },
    prompt: 'What are the key benefits of using Model Context Protocol?',
  });

  console.log('Agent Response:', result.text);

  // Show which tools were used
  if (result.toolCalls.length > 0) {
    console.log('\nTools used:');
    for (const toolCall of result.toolCalls) {
      console.log(`- ${toolCall.toolName}`);
    }
  }
};

main().catch(console.error);
