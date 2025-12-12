import { createAnthropic } from '@ai-sdk/anthropic';
import { youExpress } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

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

  // Use youExpress for fast AI agent responses with web search
  const result = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
      agent: youExpress({ apiKey: ydcApiKey }),
    },
    prompt: 'What are the key benefits of using Model Context Protocol?',
  });

  console.log('\n=== RESULT ===');

  // Extract agent response from tool results
  const toolResult = result.steps?.[0]?.content?.find((c: any) => c.type === 'tool-result') as any;
  if (toolResult?.output?.answer) {
    console.log('Agent answer:', toolResult.output.answer);

    if (toolResult.output.results?.length > 0) {
      console.log('\nSources used:');
      toolResult.output.results.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`${i + 1}. ${r.title || r.url}`);
      });
    }
  } else if (result.text) {
    console.log('Text response:', result.text);
  } else {
    console.log('(Claude returned tool results without additional text)');
  }
};

main().catch(console.error);
