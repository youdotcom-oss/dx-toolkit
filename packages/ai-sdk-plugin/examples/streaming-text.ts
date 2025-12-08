import { createYouMCPClient } from '@youdotcom-oss/ai-sdk-plugin';
import { streamText } from 'ai';

const main = async () => {
  const { tools, close } = await createYouMCPClient({
    apiKey: process.env.YDC_API_KEY,
  });

  try {
    const result = streamText({
      model: 'anthropic/claude-sonnet-4.5',
      tools: tools as any,
      prompt: 'Search for AI news and summarize the top 3 stories',
    });

    // Stream the text response
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log('\n\nStreaming complete!');
  } finally {
    await close();
  }
};

main().catch(console.error);
