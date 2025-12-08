import { createYouMCPClient, YouMCPClientError } from '@youdotcom-oss/ai-sdk-plugin';
import { generateText } from 'ai';

const main = async () => {
  try {
    // Attempt to create client
    const { tools, close } = await createYouMCPClient({
      apiKey: process.env.YDC_API_KEY,
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:4000/mcp',
    });

    try {
      const result = await generateText({
        model: 'anthropic/claude-sonnet-4.5',
        tools: tools as any,
        prompt: 'Search for TypeScript best practices',
      });

      console.log('Success:', result.text);
    } finally {
      // Always clean up
      await close();
    }
  } catch (error) {
    if (error instanceof YouMCPClientError) {
      console.error('❌ MCP Client Error:', error.message);

      if (error.message.includes('API key required')) {
        console.error('\n💡 Solution: Set YDC_API_KEY environment variable');
        console.error('   export YDC_API_KEY=your-key-here');
      } else if (error.message.includes('Failed to create MCP client')) {
        console.error('\n💡 Solution: Start the MCP server');
        console.error('   bun --cwd packages/mcp start');
        console.error('\n   Or check server URL in config');
      } else if (error.message.includes('Failed to fetch tools')) {
        console.error('\n💡 Solution: Check MCP server health');
        console.error('   curl http://localhost:4000/mcp-health');
      }

      if (error.cause) {
        console.error('\n📋 Underlying error:', error.cause);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }

    process.exit(1);
  }
};

main();
