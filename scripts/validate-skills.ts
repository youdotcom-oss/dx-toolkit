#!/usr/bin/env bun

import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Glob } from 'bun';

/**
 * Properties extracted from SKILL.md frontmatter.
 *
 * @see https://agentskills.io/specification
 * @public
 */
export type SkillProperties = {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  'allowed-tools'?: string;
  metadata?: Record<string, string>;
};

/**
 * Result of validating a skill directory.
 *
 * @public
 */
export type ValidationResult = {
  valid: boolean;
  path: string;
  errors: string[];
  warnings: string[];
  properties?: SkillProperties;
};

const ALLOWED_FIELDS = new Set(['name', 'description', 'license', 'compatibility', 'allowed-tools', 'metadata']);
const REQUIRED_FIELDS = ['name', 'description'] as const;
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_COMPATIBILITY_LENGTH = 500;

/**
 * Parse YAML frontmatter from SKILL.md content.
 *
 * @returns Tuple of [metadata, body] or throws on parse error
 */
const parseFrontmatter = (content: string): [Record<string, unknown>, string] => {
  const trimmed = content.trim();
  if (!trimmed.startsWith('---')) {
    throw new Error('SKILL.md must start with YAML frontmatter (---)');
  }

  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    throw new Error('YAML frontmatter not properly closed with ---');
  }

  const yamlContent = trimmed.slice(3, endIndex).trim();
  const body = trimmed.slice(endIndex + 3).trim();

  // Simple YAML parser for frontmatter (handles key: value and key: "value")
  const metadata: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let inMetadata = false;
  const metadataObj: Record<string, string> = {};

  for (const line of yamlContent.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for metadata block
    if (trimmedLine === 'metadata:') {
      inMetadata = true;
      continue;
    }

    // Handle metadata entries (indented key: value pairs)
    if (inMetadata && line.startsWith('  ')) {
      const metaMatch = trimmedLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (metaMatch?.[1] && metaMatch[2] !== undefined) {
        const key = metaMatch[1];
        const value = metaMatch[2];
        metadataObj[key] = value.replace(/^["']|["']$/g, '');
      }
      continue;
    }

    // Exit metadata block when encountering non-indented line
    if (inMetadata && !line.startsWith('  ')) {
      inMetadata = false;
      if (Object.keys(metadataObj).length > 0) {
        metadata.metadata = { ...metadataObj };
      }
    }

    // Parse regular key: value pairs
    const match = trimmedLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (match?.[1]) {
      const key = match[1];
      const value = match[2] ?? '';
      currentKey = key;

      // Handle multi-line strings (value on same line)
      if (value) {
        metadata[key] = value.replace(/^["']|["']$/g, '');
      }
    } else if (currentKey && trimmedLine) {
      // Handle continuation of previous value
      const prev = metadata[currentKey];
      metadata[currentKey] = typeof prev === 'string' ? `${prev} ${trimmedLine}` : trimmedLine;
    }
  }

  // Capture any remaining metadata
  if (Object.keys(metadataObj).length > 0 && !metadata.metadata) {
    metadata.metadata = { ...metadataObj };
  }

  return [metadata, body];
};

/**
 * Validate skill name according to AgentSkills specification.
 */
const validateName = (name: unknown, dirName: string): string[] => {
  const errors: string[] = [];

  if (typeof name !== 'string' || !name) {
    errors.push("Field 'name' must be a non-empty string");
    return errors;
  }

  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Skill name exceeds ${MAX_NAME_LENGTH} character limit`);
  }

  if (name !== name.toLowerCase()) {
    errors.push('Skill name must be lowercase');
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('Skill name cannot start or end with a hyphen');
  }

  if (name.includes('--')) {
    errors.push('Skill name cannot contain consecutive hyphens');
  }

  if (!NAME_PATTERN.test(name)) {
    errors.push('Skill name contains invalid characters (only lowercase alphanumeric and hyphens allowed)');
  }

  if (name !== dirName) {
    errors.push(`Directory name '${dirName}' must match skill name '${name}'`);
  }

  return errors;
};

/**
 * Validate skill description according to AgentSkills specification.
 */
const validateDescription = (description: unknown): string[] => {
  const errors: string[] = [];

  if (typeof description !== 'string' || !description) {
    errors.push("Field 'description' must be a non-empty string");
    return errors;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description exceeds ${MAX_DESCRIPTION_LENGTH} character limit`);
  }

  return errors;
};

/**
 * Validate optional compatibility field.
 */
const validateCompatibility = (compatibility: unknown): string[] => {
  const errors: string[] = [];

  if (compatibility === undefined) return errors;

  if (typeof compatibility !== 'string') {
    errors.push("Field 'compatibility' must be a string");
    return errors;
  }

  if (compatibility.length > MAX_COMPATIBILITY_LENGTH) {
    errors.push(`Compatibility exceeds ${MAX_COMPATIBILITY_LENGTH} character limit`);
  }

  return errors;
};

/**
 * Validate metadata fields are all strings.
 */
const validateMetadata = (metadata: unknown): string[] => {
  const errors: string[] = [];

  if (metadata === undefined) return errors;

  if (typeof metadata !== 'object' || metadata === null) {
    errors.push("Field 'metadata' must be an object");
    return errors;
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value !== 'string') {
      errors.push(`Metadata field '${key}' must be a string`);
    }
  }

  return errors;
};

/**
 * Check for unexpected fields in frontmatter.
 */
const validateFields = (metadata: Record<string, unknown>): string[] => {
  const warnings: string[] = [];

  for (const key of Object.keys(metadata)) {
    if (!ALLOWED_FIELDS.has(key)) {
      warnings.push(`Unexpected field in frontmatter: '${key}'`);
    }
  }

  return warnings;
};

/**
 * Find SKILL.md file in a directory (case-insensitive).
 */
const findSkillMd = async (skillDir: string): Promise<string | null> => {
  // Prefer uppercase SKILL.md
  const upperPath = join(skillDir, 'SKILL.md');
  if (await Bun.file(upperPath).exists()) {
    return upperPath;
  }

  // Fall back to lowercase
  const lowerPath = join(skillDir, 'skill.md');
  if (await Bun.file(lowerPath).exists()) {
    return lowerPath;
  }

  return null;
};

/**
 * Validate a single skill directory.
 *
 * @param skillDir - Path to the skill directory
 * @returns Validation result with errors and warnings
 *
 * @public
 */
export const validateSkill = async (skillDir: string): Promise<ValidationResult> => {
  const result: ValidationResult = {
    valid: false,
    path: skillDir,
    errors: [],
    warnings: [],
  };

  // Check directory exists
  try {
    const stat = await Bun.$`test -d ${skillDir}`.quiet();
    if (stat.exitCode !== 0) {
      result.errors.push(`Path is not a directory: ${skillDir}`);
      return result;
    }
  } catch {
    result.errors.push(`Directory does not exist: ${skillDir}`);
    return result;
  }

  // Find SKILL.md
  const skillMdPath = await findSkillMd(skillDir);
  if (!skillMdPath) {
    result.errors.push('Missing required file: SKILL.md');
    return result;
  }

  // Read and parse content
  let content: string;
  try {
    content = await Bun.file(skillMdPath).text();
  } catch (error) {
    result.errors.push(`Failed to read SKILL.md: ${error}`);
    return result;
  }

  // Parse frontmatter
  let metadata: Record<string, unknown>;
  try {
    [metadata] = parseFrontmatter(content);
  } catch (error) {
    result.errors.push(`Failed to parse frontmatter: ${error}`);
    return result;
  }

  // Check for required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in metadata)) {
      result.errors.push(`Missing required field in frontmatter: '${field}'`);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  // Validate individual fields
  // For plugin skills in plugins/*/skills/SKILL.md structure,
  // check the grandparent directory name (plugin dir) not the parent (skills dir)
  let dirName = basename(skillDir);
  if (dirName === 'skills') {
    dirName = basename(dirname(skillDir));
  }

  result.errors.push(...validateName(metadata.name, dirName));
  result.errors.push(...validateDescription(metadata.description));
  result.errors.push(...validateCompatibility(metadata.compatibility));
  result.errors.push(...validateMetadata(metadata.metadata));
  result.warnings.push(...validateFields(metadata));

  // If valid, extract properties
  if (result.errors.length === 0) {
    result.valid = true;
    const props: SkillProperties = {
      name: metadata.name as string,
      description: metadata.description as string,
    };
    if (typeof metadata.license === 'string') props.license = metadata.license;
    if (typeof metadata.compatibility === 'string') props.compatibility = metadata.compatibility;
    if (typeof metadata['allowed-tools'] === 'string') props['allowed-tools'] = metadata['allowed-tools'];
    if (metadata.metadata && typeof metadata.metadata === 'object') {
      props.metadata = metadata.metadata as Record<string, string>;
    }
    result.properties = props;
  }

  return result;
};

/**
 * Find all skill directories under a root path.
 *
 * @param rootDir - Root directory to search
 * @returns Array of skill directory paths
 *
 * @public
 */
export const findSkillDirectories = async (rootDir: string): Promise<string[]> => {
  const skillDirs: string[] = [];
  const glob = new Glob('**/SKILL.md');

  for await (const file of glob.scan({ cwd: rootDir, absolute: true })) {
    // Get parent directory of SKILL.md
    const skillDir = file.replace(/\/SKILL\.md$/i, '');
    skillDirs.push(skillDir);
  }

  return skillDirs.sort();
};

/**
 * Validate all skills under a root directory.
 *
 * @param rootDir - Root directory containing skill folders
 * @returns Array of validation results
 *
 * @public
 */
export const validateSkills = async (rootDir: string): Promise<ValidationResult[]> => {
  const skillDirs = await findSkillDirectories(rootDir);
  const results: ValidationResult[] = [];

  for (const skillDir of skillDirs) {
    results.push(await validateSkill(skillDir));
  }

  return results;
};

/**
 * CLI command for validating skills.
 *
 * @param cwd - Current working directory
 * @param paths - Paths to validate (defaults to .claude/skills/)
 * @param json - Output results as JSON
 *
 * @public
 */
export const useValidateSkillCommand = async ({
  cwd,
  paths,
  json = false,
}: {
  cwd: string;
  paths: string[];
  json?: boolean;
}) => {
  // Default to .claude/skills/ if no paths provided
  const searchPaths = paths.length > 0 ? paths : [join(cwd, '.claude/skills')];

  const allResults: ValidationResult[] = [];

  for (const searchPath of searchPaths) {
    const fullPath = searchPath.startsWith('/') ? searchPath : join(cwd, searchPath);

    // Check if path is a skill directory or a directory containing skills
    const skillMdPath = await findSkillMd(fullPath);

    if (skillMdPath) {
      // Direct skill directory
      allResults.push(await validateSkill(fullPath));
    } else {
      // Directory containing skills
      const results = await validateSkills(fullPath);
      allResults.push(...results);
    }
  }

  if (json) {
    console.log(JSON.stringify(allResults, null, 2));
  } else {
    // Human-readable output
    let hasErrors = false;

    for (const result of allResults) {
      const relativePath = result.path.replace(cwd, '').replace(/^\//, '');

      if (result.valid) {
        console.log(`✓ ${relativePath}`);
      } else {
        console.log(`✗ ${relativePath}`);
        hasErrors = true;
      }

      for (const error of result.errors) {
        console.log(`  ERROR: ${error}`);
      }

      for (const warning of result.warnings) {
        console.log(`  WARN: ${warning}`);
      }
    }

    if (allResults.length === 0) {
      console.log('No skills found to validate');
    } else {
      const valid = allResults.filter((r) => r.valid).length;
      const total = allResults.length;
      console.log(`\n${valid}/${total} skills valid`);
    }

    if (hasErrors) {
      process.exit(1);
    }
  }
};

// Parse CLI arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    json: {
      type: 'boolean',
    },
  },
  strict: true,
  allowPositionals: true,
});

// Get paths from positionals (skip first 2: bun + script path)
let paths = positionals.slice(2);

if (paths.length === 0) {
  // Default to .claude/skills/ if no paths provided
  paths = [];
}

const cwd = values.dir ? resolve(process.cwd(), values.dir) : process.cwd();

useValidateSkillCommand({ cwd, paths, json: values.json });
