import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  const { tools, close } = await createYouMCPClient({
    apiKey: process.env.YDC_API_KEY,
  });

  try {
    const result = await generateText({
      model: 'anthropic/claude-sonnet-4.5',
      tools: tools as any,
      prompt: 'Search for the latest developments in AI agents',
    });

    console.log('Response:', result.text);
    console.log('\nTool calls:', result.toolCalls.length);
  } finally {
    await close();
  }
};

main().catch(console.error);
