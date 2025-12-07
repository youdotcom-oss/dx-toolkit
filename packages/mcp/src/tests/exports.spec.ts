// src/tests/exports.spec.ts
import { describe, expect, test } from 'bun:test';
import * as exports from '@youdotcom-oss/mcp';

describe('Package exports', () => {
  test('should export all required schemas', async () => {
    // Schemas
    expect(exports.ContentsQuerySchema).toBeDefined();
    expect(exports.ExpressAgentInputSchema).toBeDefined();
    expect(exports.SearchQuerySchema).toBeDefined();

    // Utilities
    expect(exports.fetchContents).toBeDefined();
    expect(exports.formatContentsResponse).toBeDefined();
    expect(exports.callExpressAgent).toBeDefined();
    expect(exports.formatExpressAgentResponse).toBeDefined();
    expect(exports.fetchSearchResults).toBeDefined();
    expect(exports.formatSearchResults).toBeDefined();

    // Shared utilities
    expect(exports.checkResponseForErrors).toBeDefined();
    expect(exports.formatSearchResultsText).toBeDefined();
  });
});
