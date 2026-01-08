#!/usr/bin/env bun
/**
 * Search for symbols across the workspace by name
 *
 * Usage: bun lsp-find.ts <query> [file]
 */

import { parseArgs } from 'node:util';
import { LspClient } from './lsp-client.ts';
import { resolveFilePath } from './resolve-file-path.ts';

const { positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
});

const [query, filePath] = positionals;

if (!query) {
  console.error('Usage: bun lsp-find.ts <query> [file]');
  console.error('  query: Symbol name or partial name to search');
  console.error('  file: Optional file to open for project context');
  process.exit(1);
}

const rootUri = `file://${process.cwd()}`;
const client = new LspClient({ rootUri });

try {
  await client.start();

  // Open a file to establish project context if provided, otherwise use a default
  const contextFile = filePath ? await resolveFilePath(filePath) : await resolveFilePath('plaited');

  const file = Bun.file(contextFile);
  if (await file.exists()) {
    const text = await file.text();
    const uri = `file://${contextFile}`;
    const languageId = contextFile.endsWith('.tsx')
      ? 'typescriptreact'
      : contextFile.endsWith('.ts')
        ? 'typescript'
        : contextFile.endsWith('.jsx')
          ? 'javascriptreact'
          : 'javascript';

    client.openDocument(uri, languageId, 1, text);

    const result = await client.workspaceSymbols(query);

    client.closeDocument(uri);
    await client.stop();

    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error(`Warning: Context file not found: ${contextFile}`);
    console.error('Workspace symbol search requires at least one open document.');
    await client.stop();
    process.exit(1);
  }
} catch (error) {
  console.error(`Error: ${error}`);
  await client.stop();
  process.exit(1);
}
