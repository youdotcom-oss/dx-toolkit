import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  const { tools, close } = await createYouMCPClient({
    apiKey: process.env.YDC_API_KEY,
  });

  try {
    // Use you-express tool for fast AI agent responses
    const result = await generateText({
      model: 'anthropic/claude-sonnet-4.5',
      tools: tools as any,
      prompt: 'Use the you-express tool to answer: What are the key benefits of using Model Context Protocol?',
    });

    console.log('Agent Response:', result.text);

    // Show which tools were used
    if (result.toolCalls.length > 0) {
      console.log('\nTools used:');
      for (const toolCall of result.toolCalls) {
        console.log(`- ${toolCall.toolName}`);
      }
    }
  } finally {
    await close();
  }
};

main().catch(console.error);
