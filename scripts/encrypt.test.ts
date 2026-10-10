// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isStrongPasscode, parseArgs } from './encrypt'

describe('encrypt CLI helpers', () => {
  it('parses defaults and flags', () => {
    expect(parseArgs([])).toEqual({ in: 'data/firms.json', out: 'public/data/firms.enc', iterations: 600_000, allowWeak: false })
    expect(parseArgs(['--in', 'a.json', '--out', 'b.enc', '--iterations', '200000', '--allow-weak'])).toEqual({
      in: 'a.json',
      out: 'b.enc',
      iterations: 200_000,
      allowWeak: true,
    })
  })

  it('rejects bad arguments', () => {
    expect(() => parseArgs(['--iterations', '1000'])).toThrow()
    expect(() => parseArgs(['--out'])).toThrow()
    expect(() => parseArgs(['--nope'])).toThrow()
  })

  it('requires 20+ characters and 4+ words', () => {
    expect(isStrongPasscode('correct horse battery staple')).toBe(true)
    expect(isStrongPasscode('correct-horse-battery-staple')).toBe(true)
    expect(isStrongPasscode('averyveryverylongsinglepassword')).toBe(false)
    expect(isStrongPasscode('a b c d')).toBe(false)
  })
})
