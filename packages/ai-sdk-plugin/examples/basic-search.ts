import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.5',
    tools: {
      search: youSearch(),
    },
    prompt: 'Search for the latest developments in AI agents',
  });

  console.log('Response:', result.text);
  console.log('\nTool calls:', result.toolCalls.length);
};

main().catch(console.error);
