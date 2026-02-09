const creds = Bun.resolveSync('./src/credentials/YouDotComApi.credentials.ts', import.meta.dir)
const node = Bun.resolveSync('./src/nodes/YouDotCom/YouDotCom.node.ts', import.meta.dir)
const outdir = `${import.meta.dir}/dist`
const root = `${import.meta.dir}/src`

await Bun.build({
  entrypoints: [creds, node],
  outdir,
  target: 'node',
  format: 'cjs',
  external: ['n8n-workflow', 'zod'],
  root,
})
