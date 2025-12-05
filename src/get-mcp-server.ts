import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import packageJson from '../package.json' with { type: 'json' };

export const getMCpServer = () =>
  new McpServer(
    {
      name: 'You.com',
      version: packageJson.version,
    },
    {
      capabilities: {
        logging: {},
        tools: { listChanged: true },
      },
      instructions: `Use this server to search the web, get AI-powered answers with web context, and extract content from web pages using You.com. The you-contents tool extracts page content and returns it in markdown or HTML format. Use HTML format for layout preservation, interactive content, and visual fidelity; use markdown for text extraction and simpler consumption.`,
    },
  );
