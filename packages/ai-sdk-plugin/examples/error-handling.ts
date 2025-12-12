import { createAnthropic } from '@ai-sdk/anthropic';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  try {
    // Check required environment variables
    const ydcApiKey = process.env.YDC_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!ydcApiKey) {
      throw new Error('YDC_API_KEY environment variable is required');
    }

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    // Create Anthropic provider
    const anthropic = createAnthropic({
      apiKey: anthropicApiKey,
    });

    const result = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      tools: {
        search: youSearch({ apiKey: ydcApiKey }),
      },
      prompt: 'Search for TypeScript best practices',
    });

    console.log('Success:', result.text);
    console.log('\nTools used:', result.toolCalls.map((call) => call.toolName).join(', '));
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);

      if (error.message.includes('YDC_API_KEY')) {
        console.error('\n💡 Solution: Set YDC_API_KEY environment variable');
        console.error('   export YDC_API_KEY=your-key-here');
        console.error('   Get a key at: https://you.com/platform/api-keys');
      } else if (error.message.includes('ANTHROPIC_API_KEY')) {
        console.error('\n💡 Solution: Set ANTHROPIC_API_KEY environment variable');
        console.error('   export ANTHROPIC_API_KEY=your-key-here');
        console.error('   Get a key at: https://console.anthropic.com/settings/keys');
      } else if (error.message.includes('401')) {
        console.error('\n💡 Solution: Check your API key is valid');
        console.error('   You.com: https://you.com/platform/api-keys');
        console.error('   Anthropic: https://console.anthropic.com/settings/keys');
      } else if (error.message.includes('429')) {
        console.error('\n💡 Solution: Rate limit exceeded, wait and retry');
      } else {
        console.error('\n💡 Check the error message above for details');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }

    process.exit(1);
  }
};

main();
