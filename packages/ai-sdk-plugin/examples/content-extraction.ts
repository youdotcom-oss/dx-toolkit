import { createAnthropic } from '@ai-sdk/anthropic';
import { youContents } from '@youdotcom-oss/ai-sdk-plugin';
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

  // Use youContents to extract page content
  const result = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
      extract: youContents({ apiKey: ydcApiKey }),
    },
    prompt: 'Extract content from https://modelcontextprotocol.io and summarize what MCP is',
  });

  console.log('\n=== RESULT ===');

  // Extract content from tool results
  const toolResult = result.steps?.[0]?.content?.find((c: any) => c.type === 'tool-result') as any;
  if (toolResult?.output && Array.isArray(toolResult.output)) {
    const content = toolResult.output[0];
    if (content?.markdown) {
      console.log(`URL: ${content.url}`);
      console.log(`\nExtracted content (first 500 chars):`);
      console.log(`${content.markdown.substring(0, 500)}...`);
      console.log(`\nTotal content length: ${content.markdown.length} characters`);
    }
  } else if (result.text) {
    console.log('Text response:', result.text);
  } else {
    console.log('(Claude returned tool results without additional text)');
  }
};

main().catch(console.error);
