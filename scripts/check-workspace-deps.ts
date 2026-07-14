import { resolve } from 'node:path'
import { $ } from 'bun'

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const getRoot = () => {
  const rootFlagIndex = process.argv.indexOf('--root')

  return resolve(rootFlagIndex === -1 ? process.cwd() : (process.argv[rootFlagIndex + 1] ?? process.cwd()))
}

const listPackageJsonFiles = async (root: string, workspaceDirName: 'packages' | 'plugins') => {
  const workspaceDir = resolve(root, workspaceDirName)
  const result = await $`ls ${workspaceDir}`.nothrow().quiet()

  if (result.exitCode !== 0) {
    return []
  }

  const packageJsonPaths = result.stdout
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((packageDirName) => resolve(workspaceDir, packageDirName, 'package.json'))

  return (
    await Promise.all(
      packageJsonPaths.map(async (packageJsonPath) => ({
        exists: await Bun.file(packageJsonPath).exists(),
        packageJsonPath,
      })),
    )
  )
    .filter(({ exists }) => exists)
    .map(({ packageJsonPath }) => packageJsonPath)
}

const dependencyEntries = (packageJson: PackageJson) =>
  [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies,
  ].flatMap((dependencies) => Object.entries(dependencies ?? {}))

const hasNonExactWorkspaceDependency = ([name, version]: [string, string]) =>
  name.startsWith('@youdotcom-oss/') &&
  (version.startsWith('workspace:') || version.startsWith('^') || version.startsWith('~'))

const checkWorkspaceDir = async (root: string, workspaceDirName: 'packages' | 'plugins') => {
  process.stdout.write(`\nChecking ${workspaceDirName}/...\n`)
  const packageJsonFiles = await listPackageJsonFiles(root, workspaceDirName)
  const failures: string[] = []

  for (const packageJsonPath of packageJsonFiles) {
    const packageJson = (await Bun.file(packageJsonPath).json()) as PackageJson

    for (const [name, version] of dependencyEntries(packageJson).filter(hasNonExactWorkspaceDependency)) {
      failures.push(`${packageJsonPath}: ${name} must use an exact version, not ${version}`)
    }
  }

  for (const failure of failures) {
    process.stdout.write(`❌ ${failure}\n`)
  }

  return failures.length
}

const main = async () => {
  const root = getRoot()

  process.stdout.write('Checking workspace dependencies in packages/ and plugins/...\n')

  const packageFailures = await checkWorkspaceDir(root, 'packages')
  const pluginFailures = await checkWorkspaceDir(root, 'plugins')
  const failures = packageFailures + pluginFailures

  process.stdout.write('\n')

  if (failures === 0) {
    process.stdout.write('✅ All workspace dependencies use exact versions\n')
    return 0
  }

  process.stdout.write('❌ Workspace dependencies must use exact versions for published packages.\n\n')
  process.stdout.write('Correct format:\n')
  process.stdout.write('  "@youdotcom-oss/mcp": "1.3.4"\n\n')
  process.stdout.write('Incorrect formats:\n')
  process.stdout.write('  "@youdotcom-oss/mcp": "^1.3.4"  (no ^ prefix)\n')
  process.stdout.write('  "@youdotcom-oss/mcp": "~1.3.4"  (no ~ prefix)\n')
  process.stdout.write('  "@youdotcom-oss/mcp": "workspace:*"  (no workspace:*)\n')
  return 1
}

if (import.meta.main) {
  process.exit(await main())
}
