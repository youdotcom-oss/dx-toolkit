import { describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const scriptPath = resolve(import.meta.dir, '..', 'check-workspace-deps.ts')

const writePackageJson = async (path: string, dependencies: Record<string, string>) => {
  await Bun.write(
    join(path, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      dependencies,
    }),
  )
}

describe('check-workspace-deps', () => {
  test('runs through Bun instead of Bash', async () => {
    const packageJson = await Bun.file(resolve(import.meta.dir, '..', '..', 'package.json')).json()

    expect(packageJson.scripts['check:workspace-deps']).toBe('bun scripts/check-workspace-deps.ts')
  })

  test('fails when workspace package dependencies use non-exact versions', async () => {
    const root = mkdtempSync(join(tmpdir(), 'workspace-deps-'))

    try {
      await Bun.write(join(root, 'package.json'), JSON.stringify({ name: 'root' }))
      await Bun.$`mkdir -p ${join(root, 'packages', 'bad')}`
      await writePackageJson(join(root, 'packages', 'bad'), {
        '@youdotcom-oss/mcp': '^1.0.0',
      })

      const result = Bun.spawnSync({
        cmd: ['bun', scriptPath, '--root', root],
        stderr: 'pipe',
        stdout: 'pipe',
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout.toString()).toContain('use exact versions')
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })
})
