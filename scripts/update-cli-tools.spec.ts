import { describe, expect, test } from 'bun:test'
import { renderToolContract } from './update-cli-tools.ts'

describe('renderToolContract', () => {
  test('escapes payload strings when generating the tool contract module', () => {
    const output = renderToolContract({
      surfaceVersion: `2026.05.14';globalThis.pwned=true;//`,
      tools: [
        {
          name: `you-search';globalThis.pwned=true;//`,
          supportsFreeProfile: true,
        },
      ],
    })

    expect(output).toContain(`surfaceVersion: '2026.05.14\\';globalThis.pwned=true;//'`)
    expect(output).toContain(`name: 'you-search\\';globalThis.pwned=true;//'`)
    expect(output).not.toContain(`surfaceVersion: '2026.05.14';globalThis.pwned=true;//'`)
    expect(output).not.toContain(`name: 'you-search';globalThis.pwned=true;//'`)
  })
})
