const creds = Bun.resolveSync('./credentials/YouDotComApi.credentials.ts', import.meta.dir)
const node = Bun.resolveSync('./nodes/YouDotCom/YouDotCom.node.ts', import.meta.dir)
const outdir = `${import.meta.dir}/dist`

await Bun.build({
  entrypoints: [creds, node],
  outdir,
  target: 'node',
  format: 'cjs',
  external: ['n8n-workflow', 'zod'],
})
