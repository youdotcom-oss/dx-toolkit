import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { LspClient } from '../lsp-client.ts';

const rootUri = `file://${process.cwd()}`;
const testFile = `${process.cwd()}/src/ui/b-element.ts`;
const testUri = `file://${testFile}`;

describe('LspClient', () => {
  let client: LspClient;

  beforeAll(() => {
    client = new LspClient({ rootUri });
  });

  afterAll(async () => {
    if (client.isRunning()) {
      await client.stop();
    }
  });

  test('initializes with rootUri', () => {
    expect(client).toBeDefined();
    expect(client.isRunning()).toBe(false);
  });

  test('starts and stops LSP server', async () => {
    await client.start();
    expect(client.isRunning()).toBe(true);

    await client.stop();
    expect(client.isRunning()).toBe(false);
  });

  test('throws when starting already running server', async () => {
    await client.start();
    expect(client.isRunning()).toBe(true);

    await expect(client.start()).rejects.toThrow('LSP server already running');

    await client.stop();
  });

  test('handles stop on non-running server gracefully', async () => {
    expect(client.isRunning()).toBe(false);
    await client.stop();
    expect(client.isRunning()).toBe(false);
  });

  describe('LSP operations', () => {
    beforeAll(async () => {
      await client.start();
    });

    afterAll(async () => {
      await client.stop();
    });

    test('opens and closes document', async () => {
      const text = await Bun.file(testFile).text();

      client.openDocument(testUri, 'typescript', 1, text);
      client.closeDocument(testUri);
    });

    test('gets hover information', async () => {
      const text = await Bun.file(testFile).text();

      client.openDocument(testUri, 'typescript', 1, text);

      // Find 'export' keyword position for reliable hover
      const lines = text.split('\n');
      let line = 0;
      let char = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('export')) {
          line = i;
          char = 0;
          break;
        }
      }

      const result = await client.hover(testUri, line, char);
      expect(result).toBeDefined();

      client.closeDocument(testUri);
    });

    test('gets document symbols', async () => {
      const text = await Bun.file(testFile).text();

      client.openDocument(testUri, 'typescript', 1, text);

      const result = await client.documentSymbols(testUri);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      client.closeDocument(testUri);
    });

    test('searches workspace symbols', async () => {
      // Open a document first so LSP has a project context
      const text = await Bun.file(testFile).text();
      client.openDocument(testUri, 'typescript', 1, text);

      const result = await client.workspaceSymbols('bElement');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      client.closeDocument(testUri);
    });

    test('finds references', async () => {
      const text = await Bun.file(testFile).text();

      client.openDocument(testUri, 'typescript', 1, text);

      // Find an exported symbol
      const lines = text.split('\n');
      let line = 0;
      let char = 0;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/export\s+const\s+(\w+)/);
        if (match) {
          line = i;
          char = lines[i].indexOf(match[1]);
          break;
        }
      }

      const result = await client.references(testUri, line, char);
      expect(result).toBeDefined();

      client.closeDocument(testUri);
    });

    test('gets definition', async () => {
      const text = await Bun.file(testFile).text();

      client.openDocument(testUri, 'typescript', 1, text);

      // Find an import to get definition for
      const lines = text.split('\n');
      let line = 0;
      let char = 0;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/import\s+.*{\s*(\w+)/);
        if (match) {
          line = i;
          char = lines[i].indexOf(match[1]);
          break;
        }
      }

      const result = await client.definition(testUri, line, char);
      expect(result).toBeDefined();

      client.closeDocument(testUri);
    });
  });

  describe('error handling', () => {
    test('throws on request when server not running', async () => {
      const notRunningClient = new LspClient({ rootUri });

      await expect(notRunningClient.hover('file:///test.ts', 0, 0)).rejects.toThrow('LSP server not running');
    });

    test('throws on notify when server not running', () => {
      const notRunningClient = new LspClient({ rootUri });

      expect(() => notRunningClient.notify('test')).toThrow('LSP server not running');
    });
  });
});
