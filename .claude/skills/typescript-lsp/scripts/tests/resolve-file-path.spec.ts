import { describe, expect, test } from 'bun:test';
import { resolveFilePath } from '../resolve-file-path.ts';

describe('resolveFilePath', () => {
  test('returns absolute path as-is', async () => {
    const absolutePath = '/Users/test/file.ts';
    const result = await resolveFilePath(absolutePath);
    expect(result).toBe(absolutePath);
  });

  test('resolves relative path from cwd', async () => {
    const relativePath = './src/main.ts';
    const result = await resolveFilePath(relativePath);
    expect(result).toBe(`${process.cwd()}/./src/main.ts`);
  });

  test('resolves package export path via Bun.resolve', async () => {
    const packagePath = 'plaited/workshop/get-paths.ts';
    const result = await resolveFilePath(packagePath);

    expect(result).toEndWith('/src/workshop/get-paths.ts');
    expect(result.startsWith('/')).toBe(true);
  });

  test('resolves main package export', async () => {
    const packagePath = 'plaited';
    const result = await resolveFilePath(packagePath);

    expect(result).toEndWith('/src/main.ts');
  });

  test('falls back to cwd for non-existent package', async () => {
    const invalidPath = 'nonexistent-package/file.ts';
    const result = await resolveFilePath(invalidPath);

    expect(result).toBe(`${process.cwd()}/${invalidPath}`);
  });

  test('resolves nested package export', async () => {
    const packagePath = 'plaited/testing';
    const result = await resolveFilePath(packagePath);

    expect(result).toEndWith('/src/testing.ts');
  });
});
