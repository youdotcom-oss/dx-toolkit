import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { streamText } from 'ai';

const main = async () => {
  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      search: youSearch(),
    },
    prompt: 'Search for AI news and summarize the top 3 stories',
  });

  // Stream the text response
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n\nStreaming complete!');
};

main().catch(console.error);
