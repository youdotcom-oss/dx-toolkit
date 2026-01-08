#!/usr/bin/env bun
/**
 * Get type information at a position in a TypeScript/JavaScript file
 *
 * Usage: bun lsp-hover.ts <file> <line> <character>
 */

import { parseArgs } from 'node:util';
import { LspClient } from './lsp-client.ts';
import { resolveFilePath } from './resolve-file-path.ts';

const { positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
});

const [filePath, lineStr, charStr] = positionals;

if (!filePath || !lineStr || !charStr) {
  console.error('Usage: bun lsp-hover.ts <file> <line> <character>');
  console.error('  file: Path to TypeScript/JavaScript file');
  console.error('  line: Line number (0-indexed)');
  console.error('  character: Character position (0-indexed)');
  process.exit(1);
}

const line = parseInt(lineStr, 10);
const character = parseInt(charStr, 10);

if (Number.isNaN(line) || Number.isNaN(character)) {
  console.error('Error: line and character must be numbers');
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

  const result = await client.hover(uri, line, character);

  client.closeDocument(uri);
  await client.stop();

  if (result) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('null');
  }
} catch (error) {
  console.error(`Error: ${error}`);
  await client.stop();
  process.exit(1);
}
