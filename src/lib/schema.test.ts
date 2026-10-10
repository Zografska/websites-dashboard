import { describe, expect, it } from 'vitest'
import { formatPath, parseDataFile } from './schema'
import { claim, crawl, dataFile, f006, firm } from './testData'
import type { DataFile } from './types'

function issuesOf(data: unknown) {
  const r = parseDataFile(data)
  if (r.ok) throw new Error('expected failure')
  return r.issues
}

describe('parseDataFile', () => {
  it('accepts a valid file', () => {
    const r = parseDataFile(dataFile())
    expect(r.ok).toBe(true)
  })

  it('strips unknown keys', () => {
    const d = dataFile() as DataFile & { extra?: number }
    d.extra = 1
    ;(d.firms[0].claims[0] as Record<string, unknown>).review = { status: 'confirmed' }
    const r = parseDataFile(d)
    if (!r.ok) throw new Error('expected ok')
    expect('extra' in r.data).toBe(false)
    expect('review' in r.data.firms[0].claims[0]).toBe(false)
  })

  const crossCases: [string, (d: DataFile) => void, string, RegExp][] = [
    ['duplicate category', (d) => d.categories.push('certification'), 'categories[3]', /duplicate category/],
    ['duplicate firm_id', (d) => (d.firms[1].firm_id = 'F006'), 'firms[1].firm_id', /duplicate firm_id/],
    ['duplicate crawl_id', (d) => (d.firms[0].crawls[1].crawl_id = 'F006-C01'), 'firms[0].crawls[1].crawl_id', /duplicate crawl_id/],
    ['duplicate claim_id', (d) => (d.firms[0].claims[1].claim_id = 'F006-aaaaaa'), 'firms[0].claims[1].claim_id', /duplicate claim_id/],
    ['claim_id prefix', (d) => (d.firms[0].claims[0].claim_id = 'F999-aaaaaa'), 'firms[0].claims[0].claim_id', /must start with F006-/],
    ['unknown category', (d) => (d.firms[0].claims[0].category = 'nope'), 'firms[0].claims[0].category', /unknown category nope/],
    ['unknown crawl', (d) => (d.firms[0].claims[0].seen_in_crawls[0] = 'F006-C99'), 'firms[0].claims[0].seen_in_crawls[0]', /unknown crawl F006-C99/],
    [
      'failed crawl',
      (d) => d.firms[0].claims[0].seen_in_crawls.push('F006-C04'),
      'firms[0].claims[0].seen_in_crawls[3]',
      /^claim seen in failed crawl F006-C04$/,
    ],
    ['duplicate seen', (d) => d.firms[0].claims[0].seen_in_crawls.push('F006-C01'), 'firms[0].claims[0].seen_in_crawls[3]', /duplicate crawl/],
  ]

  it.each(crossCases)('cross-check: %s', (_name, mutate, path, message) => {
    const d = dataFile()
    mutate(d)
    // Some mutations also cause knock-on issues (e.g. a renamed firm breaks its claim-ID prefixes).
    const match = issuesOf(d).filter((i) => i.path === path && message.test(i.message))
    expect(match).toHaveLength(1)
  })

  it('rejects bad enums', () => {
    const d = dataFile()
    ;(d.firms[0].claims[0] as Record<string, unknown>).confidence = 'severe'
    ;(d.firms[0].crawls[0] as Record<string, unknown>).status = 'done'
    const paths = issuesOf(d).map((i) => i.path)
    expect(paths).toContain('firms[0].claims[0].confidence')
    expect(paths).toContain('firms[0].crawls[0].status')
  })

  it('rejects non-http URLs and bad dates', () => {
    const d = dataFile()
    d.firms[0].website = 'ftp://www.verdeluce.example'
    d.firms[0].claims[0].source_url = 'not a url'
    d.generated_at = '2026-11-02'
    const paths = issuesOf(d).map((i) => i.path)
    expect(paths).toEqual(expect.arrayContaining(['firms[0].website', 'firms[0].claims[0].source_url', 'generated_at']))
  })

  it('rejects a firm with no crawls and a claim seen nowhere', () => {
    const d = dataFile([firm('F001', [], []), firm('F002', [crawl('F002', 1)], [claim('F002', 'aaaaaa', [])])])
    const paths = issuesOf(d).map((i) => i.path)
    expect(paths).toEqual(expect.arrayContaining(['firms[0].crawls', 'firms[1].claims[0].seen_in_crawls']))
  })

  it('accepts schema 1.x and rejects 2.0', () => {
    expect(parseDataFile({ ...dataFile(), schema_version: '1.3' }).ok).toBe(true)
    expect(issuesOf({ ...dataFile(), schema_version: '2.0' })[0].path).toBe('schema_version')
  })

  it('accepts nullable legal refs and gray zone, rejects empty strings', () => {
    const f = f006()
    f.claims[0].legal_ref = { ucpd: null, codice_consumo: null }
    f.claims[1].gray_zone = ''
    const issues = issuesOf(dataFile([f]))
    expect(issues.map((i) => i.path)).toEqual(['firms[0].claims[1].gray_zone'])
  })
})

describe('formatPath', () => {
  it('renders mixed paths', () => {
    expect(formatPath(['firms', 3, 'claims', 12, 'category'])).toBe('firms[3].claims[12].category')
    expect(formatPath([])).toBe('(root)')
  })
})
