import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createYouMCPClient } from '../client.ts';
import { EXPECTED_TOOLS } from '../constants.ts';
import type { YouMCPClientResult } from '../types.ts';

/**
 * Integration tests for MCP client
 *
 * Requirements:
 * 1. YDC_API_KEY environment variable must be set
 * 2. MCP server must be running: bun --cwd packages/mcp start
 *
 * These tests are automatically skipped if YDC_API_KEY is not set.
 */

const hasApiKey = !!process.env.YDC_API_KEY;

describe.skipIf(!hasApiKey)('Integration with MCP Server', () => {
  let clientResult: YouMCPClientResult;

  beforeAll(async () => {
    clientResult = await createYouMCPClient({
      serverUrl: 'http://localhost:4000/mcp',
    });
  });

  afterAll(async () => {
    await clientResult.close();
  });

  test('should connect to MCP server successfully', () => {
    expect(clientResult).toBeDefined();
    expect(clientResult.tools).toBeDefined();
    expect(clientResult.client).toBeDefined();
    expect(clientResult.close).toBeDefined();
    expect(typeof clientResult.close).toBe('function');
  });

  test('should fetch tools from server', () => {
    expect(clientResult.tools).toBeDefined();
    expect(typeof clientResult.tools).toBe('object');
    expect(Object.keys(clientResult.tools).length).toBeGreaterThan(0);
  });

  test('should have all expected tools', () => {
    for (const toolName of EXPECTED_TOOLS) {
      expect(clientResult.tools).toHaveProperty(toolName);
    }
  });

  test('should have valid tool structure for you-search', () => {
    const searchTool = clientResult.tools['you-search'];
    expect(searchTool).toBeDefined();
    if (!searchTool) return;
    expect(searchTool).toHaveProperty('description');
    expect(searchTool).toHaveProperty('parameters');
    expect(searchTool).toHaveProperty('execute');
    expect(typeof searchTool.execute).toBe('function');
  });

  test('should have valid tool structure for you-express', () => {
    const expressTool = clientResult.tools['you-express'];
    expect(expressTool).toBeDefined();
    if (!expressTool) return;
    expect(expressTool).toHaveProperty('description');
    expect(expressTool).toHaveProperty('parameters');
    expect(expressTool).toHaveProperty('execute');
    expect(typeof expressTool.execute).toBe('function');
  });

  test('should have valid tool structure for you-contents', () => {
    const contentsTool = clientResult.tools['you-contents'];
    expect(contentsTool).toBeDefined();
    if (!contentsTool) return;
    expect(contentsTool).toHaveProperty('description');
    expect(contentsTool).toHaveProperty('parameters');
    expect(contentsTool).toHaveProperty('execute');
    expect(typeof contentsTool.execute).toBe('function');
  });

  test('should have MCP client with methods', () => {
    expect(clientResult.client).toBeDefined();
    expect(clientResult.client).toHaveProperty('tools');
    expect(clientResult.client).toHaveProperty('close');
  });
});

// Show a helpful message when tests are skipped
if (!hasApiKey) {
  console.log('\n⚠️  Integration tests skipped - YDC_API_KEY not set\n');
  console.log('To run integration tests:');
  console.log('1. Set YDC_API_KEY environment variable');
  console.log('2. Start MCP server: bun --cwd packages/mcp start');
  console.log('3. Run tests: bun test\n');
}
