import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  try {
    // Configure API key (from env var or passed directly)
    const apiKey = process.env.YDC_API_KEY;

    if (!apiKey) {
      throw new Error('YDC_API_KEY environment variable is required');
    }

    const result = await generateText({
      model: 'anthropic/claude-sonnet-4.5',
      tools: {
        search: youSearch({ apiKey }),
      },
      prompt: 'Search for TypeScript best practices',
    });

    console.log('Success:', result.text);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);

      if (error.message.includes('YDC_API_KEY')) {
        console.error('\n💡 Solution: Set YDC_API_KEY environment variable');
        console.error('   export YDC_API_KEY=your-key-here');
      } else if (error.message.includes('401')) {
        console.error('\n💡 Solution: Check your API key is valid');
        console.error('   Get a new key at: https://you.com/platform/api-keys');
      } else if (error.message.includes('429')) {
        console.error('\n💡 Solution: Rate limit exceeded, wait and retry');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }

    process.exit(1);
  }
};

main();
