#!/usr/bin/env bun
/**
 * Batch analysis script for TypeScript/JavaScript files
 *
 * Performs multiple LSP queries in a single session for efficiency.
 * Useful for understanding a file before making changes.
 *
 * Usage: bun lsp-analyze.ts <file> [options]
 *
 * Options:
 *   --symbols, -s       List all symbols in the file
 *   --exports, -e       List only exported symbols
 *   --hover <line:char> Get type info at position (can be repeated)
 *   --refs <line:char>  Find references at position (can be repeated)
 *   --all               Run all analyses (symbols + exports)
 */

import { parseArgs } from 'node:util';
import { LspClient } from './lsp-client.ts';
import { resolveFilePath } from './resolve-file-path.ts';

type SymbolInfo = {
  name: string;
  kind: number;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  children?: SymbolInfo[];
};

const symbolKindNames: Record<number, string> = {
  1: 'File',
  2: 'Module',
  3: 'Namespace',
  4: 'Package',
  5: 'Class',
  6: 'Method',
  7: 'Property',
  8: 'Field',
  9: 'Constructor',
  10: 'Enum',
  11: 'Interface',
  12: 'Function',
  13: 'Variable',
  14: 'Constant',
  15: 'String',
  16: 'Number',
  17: 'Boolean',
  18: 'Array',
  19: 'Object',
  20: 'Key',
  21: 'Null',
  22: 'EnumMember',
  23: 'Struct',
  24: 'Event',
  25: 'Operator',
  26: 'TypeParameter',
};

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    symbols: { type: 'boolean', short: 's' },
    exports: { type: 'boolean', short: 'e' },
    hover: { type: 'string', multiple: true },
    refs: { type: 'string', multiple: true },
    all: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

if (values.help || positionals.length === 0) {
  console.log(`
LSP Analyze - Batch analysis for TypeScript/JavaScript files

Usage: bun lsp-analyze.ts <file> [options]

Options:
  --symbols, -s       List all symbols in the file
  --exports, -e       List only exported symbols
  --hover <line:char> Get type info at position (can be repeated)
  --refs <line:char>  Find references at position (can be repeated)
  --all               Run all analyses (symbols + exports)
  --help, -h          Show this help

Examples:
  bun lsp-analyze.ts plaited/main/b-element.ts --all
  bun lsp-analyze.ts plaited/main/b-element.ts --symbols
  bun lsp-analyze.ts plaited/main/b-element.ts --hover 50:15 --hover 60:20
  bun lsp-analyze.ts plaited/main/b-element.ts --refs 10:8
`);
  process.exit(0);
}

const [filePath] = positionals;
const absolutePath = await resolveFilePath(filePath);
const uri = `file://${absolutePath}`;
const rootUri = `file://${process.cwd()}`;

const client = new LspClient({ rootUri });

type AnalysisResult = {
  file: string;
  symbols?: Array<{ name: string; kind: string; line: number }>;
  exports?: Array<{ name: string; kind: string; line: number }>;
  hovers?: Array<{ position: string; content: unknown }>;
  references?: Array<{ position: string; locations: unknown }>;
};

const extractSymbols = (symbols: SymbolInfo[], prefix = ''): Array<{ name: string; kind: string; line: number }> => {
  const result: Array<{ name: string; kind: string; line: number }> = [];
  for (const sym of symbols) {
    result.push({
      name: prefix ? `${prefix}.${sym.name}` : sym.name,
      kind: symbolKindNames[sym.kind] || `Unknown(${sym.kind})`,
      line: sym.range.start.line,
    });
    if (sym.children) {
      result.push(...extractSymbols(sym.children, sym.name));
    }
  }
  return result;
};

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

  const result: AnalysisResult = { file: filePath };

  // Get symbols if requested
  if (values.symbols || values.exports || values.all) {
    const symbols = (await client.documentSymbols(uri)) as SymbolInfo[];
    const extracted = extractSymbols(symbols);

    if (values.symbols || values.all) {
      result.symbols = extracted;
    }

    if (values.exports || values.all) {
      // Filter to only top-level exports (items that start with export in source)
      const lines = text.split('\n');
      result.exports = extracted.filter((sym) => {
        const line = lines[sym.line];
        return line?.includes('export');
      });
    }
  }

  // Get hover info if requested
  if (values.hover?.length) {
    result.hovers = [];
    for (const pos of values.hover) {
      const [lineStr, charStr] = pos.split(':');
      const line = parseInt(lineStr, 10);
      const char = parseInt(charStr, 10);

      if (!Number.isNaN(line) && !Number.isNaN(char)) {
        const hover = await client.hover(uri, line, char);
        result.hovers.push({ position: pos, content: hover });
      }
    }
  }

  // Get references if requested
  if (values.refs?.length) {
    result.references = [];
    for (const pos of values.refs) {
      const [lineStr, charStr] = pos.split(':');
      const line = parseInt(lineStr, 10);
      const char = parseInt(charStr, 10);

      if (!Number.isNaN(line) && !Number.isNaN(char)) {
        const refs = await client.references(uri, line, char, true);
        result.references.push({ position: pos, locations: refs });
      }
    }
  }

  client.closeDocument(uri);
  await client.stop();

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Error: ${error}`);
  await client.stop();
  process.exit(1);
}
