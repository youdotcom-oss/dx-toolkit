/**
 * Resolve a file path to an absolute path
 *
 * @remarks
 * Handles three types of paths:
 * - Absolute paths (starting with `/`) - returned as-is
 * - Relative paths (starting with `.`) - resolved from cwd
 * - Package export paths (e.g., `plaited/workshop/get-paths.ts`) - resolved via Bun.resolve()
 */
export const resolveFilePath = async (filePath: string): Promise<string> => {
  // Absolute path
  if (filePath.startsWith('/')) {
    return filePath;
  }

  // Relative path from cwd
  if (filePath.startsWith('.')) {
    return `${process.cwd()}/${filePath}`;
  }

  // Try package export path resolution
  try {
    return await Bun.resolve(filePath, process.cwd());
  } catch {
    // Fall back to relative path from cwd
    return `${process.cwd()}/${filePath}`;
  }
};
