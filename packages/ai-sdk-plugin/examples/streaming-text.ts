import { createAnthropic } from '@ai-sdk/anthropic';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { streamText } from 'ai';

const main = async () => {
  // Check required environment variables
  const ydcApiKey = process.env.YDC_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!ydcApiKey) {
    console.error('❌ Error: YDC_API_KEY environment variable is required');
    console.error('💡 Solution: Set your You.com API key');
    console.error('   export YDC_API_KEY=your-key-here');
    console.error('   Get a key at: https://you.com/platform/api-keys');
    process.exit(1);
  }

  if (!anthropicApiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('💡 Solution: Set your Anthropic API key');
    console.error('   export ANTHROPIC_API_KEY=your-key-here');
    console.error('   Get a key at: https://console.anthropic.com/settings/keys');
    process.exit(1);
  }

  // Create Anthropic provider
  const anthropic = createAnthropic({
    apiKey: anthropicApiKey,
  });

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
      search: youSearch({ apiKey: ydcApiKey }),
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
