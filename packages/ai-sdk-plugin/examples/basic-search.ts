import { createAnthropic } from '@ai-sdk/anthropic';
import { youSearch } from '@youdotcom-oss/ai-sdk-plugin';
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

  const result = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
      search: youSearch({ apiKey: ydcApiKey }),
    },
    system:
      "After completing a task that involves tool use, provide a detailed summary of the work you've done and the results you found.",
    prompt: 'Search for the latest developments in AI agents.',
  });

  // Claude Sonnet 4.5 is optimized for efficiency and typically returns tool results
  // without verbose summaries. Access the search results from the tool output:
  console.log('=== RESULT ===\n');
  console.log('Text response:', result.text || '(Claude returned tool results without additional text)');
  console.log('\nFinish reason:', result.finishReason);
  console.log('Steps:', result.steps?.length);

  // Extract search results from the tool call
  const toolResult = result.steps?.[0]?.content?.find((c: any) => c.type === 'tool-result') as any;
  if (toolResult) {
    console.log('\n=== SEARCH RESULTS ===');
    const output = toolResult.output as any;
    console.log(`Found ${output.results.web.length} web results and ${output.results.news.length} news articles`);
    console.log('\nTop 3 web results:');
    output.results.web.slice(0, 3).forEach((result: any, i: number) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   ${result.url}`);
      console.log(`   ${result.description}`);
    });
  }
};

main().catch(console.error);
