import { config } from '@n8n/node-cli/eslint'

export default [{ ignores: ['**/tests/**', '**/*.test.ts', '**/*.spec.ts'] }, ...config]
