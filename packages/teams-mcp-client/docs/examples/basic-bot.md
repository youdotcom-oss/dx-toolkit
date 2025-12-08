# Basic Teams Bot Example

This guide demonstrates how to create a simple Microsoft Teams bot with web search capabilities using the `@youdotcom-oss/teams-mcp-client` library.

## Prerequisites

- Node.js >= 18 or Bun >= 1.2.21
- You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys)
- Teams Bot Framework setup (see [Microsoft Teams documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots))

## Installation

```bash
npm install @youdotcom-oss/teams-mcp-client @microsoft/teams.ai
```

## Environment Setup

Create a `.env` file in your project root:

```bash
# You.com API Key
YDC_API_KEY=your-api-key-here

# Microsoft App Credentials
MICROSOFT_APP_ID=your-app-id
MICROSOFT_APP_PASSWORD=your-app-password
```

## Basic Bot Implementation

### Step 1: Create the MCP Plugin

Create a file `src/mcp-config.ts`:

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

// Create and export the MCP plugin
export const { plugin: mcpPlugin, config: mcpConfig } = createMcpPlugin({
  apiKey: process.env.YDC_API_KEY,
  debug: process.env.NODE_ENV === 'development',
});
```

### Step 2: Create the Bot Application

Create a file `src/bot.ts`:

```typescript
import { Application, ApplicationOptions } from '@microsoft/teams.ai';
import { mcpPlugin, mcpConfig } from './mcp-config.js';

// Configure the bot application
const appOptions: ApplicationOptions = {
  ai: {
    planner: {
      instructions: `
You are a helpful assistant with access to real-time web search.

When users ask questions:
1. Use the you-search tool to find current information
2. Use the you-express tool for quick AI-powered answers with web context
3. Use the you-contents tool to extract full content from specific URLs

Always cite your sources and provide accurate, up-to-date information.
      `.trim(),
      model: {
        // Your AI model configuration (Azure OpenAI, OpenAI, etc.)
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: 'gpt-4',
      },
      plugins: [mcpPlugin],
    },
  },
};

// Create the application
export const app = new Application(appOptions);

// Register the MCP client plugin
app.ai.planner.usePlugin('mcpClient', mcpConfig);

// Handle incoming messages
app.message(/.*/, async (context, _state) => {
  await context.sendActivity('Thinking...');

  try {
    // The AI will automatically use MCP tools to answer
    const response = await app.ai.completePrompt(context, _state);

    if (response.status === 'success') {
      await context.sendActivity(response.text || 'I processed your request.');
    } else {
      await context.sendActivity('Sorry, I encountered an error processing your request.');
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await context.sendActivity('Sorry, something went wrong.');
  }
});
```

### Step 3: Start the Bot Server

Create a file `src/index.ts`:

```typescript
import { BotFrameworkAdapter } from 'botbuilder';
import restify from 'restify';
import { app } from './bot.js';

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error('Bot error:', error);
  await context.sendActivity('Oops! Something went wrong.');
};

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Listen for incoming requests
server.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, async (context) => {
    await app.run(context);
  });
});

// Start server
const port = process.env.PORT || 3978;
server.listen(port, () => {
  console.log(`Bot listening on port ${port}`);
  console.log(`MCP plugin connected to: ${mcpConfig.mcpUrl}`);
});
```

### Step 4: Add Scripts to package.json

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc"
  }
}
```

## Running the Bot

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build && npm start
```

## Testing the Bot

1. **Install Bot Framework Emulator**: Download from [GitHub](https://github.com/microsoft/BotFramework-Emulator/releases)

2. **Connect to your bot**:
   - Open Bot Framework Emulator
   - Enter bot URL: `http://localhost:3978/api/messages`
   - Enter Microsoft App ID and Password from `.env`

3. **Test queries**:
   ```
   User: What's the latest news about AI?
   Bot: [Uses you-search tool to find latest AI news and responds]

   User: Explain quantum computing in simple terms
   Bot: [Uses you-express tool to get AI-powered explanation with web context]

   User: Get the full content of https://example.com/article
   Bot: [Uses you-contents tool to extract and summarize the article]
   ```

## Example Interactions

### Web Search

```
User: What's the weather in San Francisco today?

Bot: Based on current web search, San Francisco is experiencing:
- Temperature: 65°F (18°C)
- Conditions: Partly cloudy
- Wind: 12 mph from the west
- Humidity: 60%

Source: [Weather.com](https://weather.com/...) retrieved at 2:30 PM PST
```

### AI-Powered Answers

```
User: How does photosynthesis work?

Bot: Photosynthesis is the process by which plants convert light energy into chemical energy:

1. Light Absorption: Chlorophyll in leaves absorbs sunlight
2. Water Splitting: Light energy splits water molecules (H₂O) into oxygen and hydrogen
3. Carbon Fixation: CO₂ from the air combines with hydrogen to form glucose
4. Energy Storage: Glucose stores energy for the plant's growth and metabolism

The basic equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂

This process is essential for life on Earth, producing oxygen and forming the base of most food chains.

Sources: [Biology Online](https://...), [Khan Academy](https://...)
```

### Content Extraction

```
User: Summarize this article: https://techcrunch.com/2024/article

Bot: Here's a summary of the TechCrunch article:

**Headline**: [Article Title]

**Key Points**:
- Point 1: [Summary]
- Point 2: [Summary]
- Point 3: [Summary]

**Conclusion**: [Summary of conclusion]

Full article: [TechCrunch](https://techcrunch.com/2024/article)
```

## Project Structure

```
my-teams-bot/
├── src/
│   ├── index.ts           # Server entry point
│   ├── bot.ts             # Bot application
│   └── mcp-config.ts      # MCP plugin configuration
├── .env                   # Environment variables
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

## Next Steps

- Add [advanced error handling](./advanced-patterns.md)
- Implement conversation state management
- Add proactive messaging
- Deploy to [Azure](./deployment.md)
- Add authentication and authorization

## Troubleshooting

### Bot Not Responding

**Check**:
1. MCP plugin initialized: Look for console message "MCP plugin connected to..."
2. API key is valid: Test at [api.you.com](https://api.you.com)
3. Bot Framework adapter configured correctly
4. Port 3978 is not in use

### MCP Tools Not Working

**Check**:
1. `YDC_API_KEY` environment variable is set
2. Plugin registered with `usePlugin('mcpClient', mcpConfig)`
3. AI model has access to tools/functions
4. Check console for MCP-related errors

### Performance Issues

**Solutions**:
1. Increase MCP timeout:
   ```typescript
   createMcpPlugin({ timeout: 60000 }) // 60 seconds
   ```
2. Implement response caching
3. Use streaming responses for large content
4. Add rate limiting

## Additional Resources

- [Microsoft Teams AI Library](https://github.com/microsoft/teams-ai)
- [Bot Framework Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [You.com MCP Server API](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp)
- [Advanced Patterns](./advanced-patterns.md)
- [Deployment Guide](./deployment.md)
