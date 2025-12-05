import { describe, expect, test } from 'bun:test';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { useGetClientVersion } from '../use-client-version.ts';

describe('useGetClientVersion', () => {
  test('returns formatted string with all fields present', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'test-client',
          version: '1.0.0',
          title: 'Test Client',
          websiteUrl: 'https://example.com',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; test-client; 1\.0\.0; Test Client; https:\/\/example\.com\)$/);
  });

  test('returns formatted string with name and version only', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'test-client',
          version: '1.0.0',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; test-client; 1\.0\.0\)$/);
  });

  test('returns UNKNOWN when no client version available', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => null,
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; UNKNOWN\)$/);
  });

  test('returns UNKNOWN when getClientVersion returns undefined', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => undefined,
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; UNKNOWN\)$/);
  });

  test('filters out empty strings from fields', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'test-client',
          version: '1.0.0',
          title: '', // Empty string should be filtered out
          websiteUrl: 'https://example.com',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; test-client; 1\.0\.0; https:\/\/example\.com\)$/);
    expect(result).not.toContain(';;'); // No double semicolons
  });

  test('filters out null values from fields', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'test-client',
          version: '1.0.0',
          title: null, // Null should be filtered out
          websiteUrl: 'https://example.com',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; test-client; 1\.0\.0; https:\/\/example\.com\)$/);
  });

  test('handles partial fields - name, version, and title only', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'Claude Desktop',
          version: '0.7.6',
          title: 'Claude Desktop App',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; Claude Desktop; 0\.7\.6; Claude Desktop App\)$/);
  });

  test('handles Claude Desktop client info format', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'Claude Desktop',
          version: '0.7.6',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);
    const result = getUserAgent();

    expect(result).toMatch(/^MCP\/[\d.]+ \(You\.com; Claude Desktop; 0\.7\.6\)$/);
  });

  test('returns a function that can be called multiple times', () => {
    const mockMcp = {
      server: {
        getClientVersion: () => ({
          name: 'test-client',
          version: '1.0.0',
        }),
      },
    } as unknown as McpServer;

    const getUserAgent = useGetClientVersion(mockMcp);

    // Call multiple times to ensure consistent results
    const result1 = getUserAgent();
    const result2 = getUserAgent();
    const result3 = getUserAgent();

    const pattern = /^MCP\/[\d.]+ \(You\.com; test-client; 1\.0\.0\)$/;
    expect(result1).toMatch(pattern);
    expect(result2).toMatch(pattern);
    expect(result3).toMatch(pattern);
  });
});
