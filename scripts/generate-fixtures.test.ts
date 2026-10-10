// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseDataFile } from '../src/lib/schema'
import { coverageFailures, generateFixtures, serialize } from './generate-fixtures'

describe('generate-fixtures', () => {
  it('is byte-for-byte deterministic, valid and meets every coverage assert', async () => {
    const a = serialize(await generateFixtures())
    const b = serialize(await generateFixtures())
    expect(a).toBe(b)
    const json: unknown = JSON.parse(a)
    expect(parseDataFile(json).ok).toBe(true)
    expect(coverageFailures(JSON.parse(a))).toEqual([])
  }, 30_000)

  it('uses fictional .example domains only', async () => {
    const data = await generateFixtures()
    for (const f of data.firms) {
      expect(new URL(f.website).hostname).toMatch(/\.example$/)
      for (const c of f.claims) expect(new URL(c.source_url).hostname).toBe(new URL(f.website).hostname)
    }
  })

  it('reports failures for broken data', async () => {
    const data = await generateFixtures()
    data.firms[3].claims = data.firms[0].claims.map((c) => ({ ...c }))
    data.firms.pop()
    const failures = coverageFailures(data)
    expect(failures.some((f) => f.startsWith('expected 40 firms'))).toBe(true)
    expect(failures.some((f) => f.startsWith('F004'))).toBe(true)
  })
})
