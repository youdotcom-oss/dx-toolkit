import packageJson from '../../package.json' with { type: 'json' }
import type { GetUserAgent } from './api.types.ts'

// getUserAgent function for tracking
export const useGetUserAgent =
  (client = ''): GetUserAgent =>
  () =>
    `CLI/ ${packageJson.version} (You.com;${client})`
