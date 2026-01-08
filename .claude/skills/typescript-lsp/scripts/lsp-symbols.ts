#!/usr/bin/env bun
/**
 * Get all symbols (functions, classes, types, etc.) in a TypeScript/JavaScript file
 *
 * Usage: bun lsp-symbols.ts <file>
 */

import { parseArgs } from 'node:util';
import { LspClient } from './lsp-client.ts';
import { resolveFilePath } from './resolve-file-path.ts';

const { positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
});

const [filePath] = positionals;

if (!filePath) {
  console.error('Usage: bun lsp-symbols.ts <file>');
  console.error('  file: Path to TypeScript/JavaScript file');
  process.exit(1);
}

const absolutePath = await resolveFilePath(filePath);
const uri = `file://${absolutePath}`;
const rootUri = `file://${process.cwd()}`;

const client = new LspClient({ rootUri });

try {
  await client.start();

  const file = Bun.file(absolutePath);
  if (!(await file.exists())) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  const text = await file.text();
  const languageId = absolutePath.endsWith('.tsx')
    ? 'typescriptreact'
    : absolutePath.endsWith('.ts')
      ? 'typescript'
      : absolutePath.endsWith('.jsx')
        ? 'javascriptreact'
        : 'javascript';

  client.openDocument(uri, languageId, 1, text);

  const result = await client.documentSymbols(uri);

  client.closeDocument(uri);
  await client.stop();

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Error: ${error}`);
  await client.stop();
  process.exit(1);
}
