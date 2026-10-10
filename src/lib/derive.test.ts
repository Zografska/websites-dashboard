import { describe, expect, it } from 'vitest'
import {
  applyFilters,
  categoryBreakdown,
  confidenceCounts,
  crawlHistory,
  firstSeen,
  getLatestCrawl,
  getNewestCrawl,
  highestConfidence,
  isPresent,
  lastSeen,
  presentClaims,
  sortCrawlsAsc,
  sortForStrip,
  stripCounts,
  timelineSeries,
} from './derive'
import { NO_FILTERS } from './filters'
import { CATS, claim, crawl, f006, f008, f011, firm } from './testData'

describe('crawls', () => {
  it('sorts by date, ties by crawl_id', () => {
    const a = { ...crawl('X', 2), crawled_at: '2026-10-05T09:00:00Z' }
    const b = crawl('X', 1)
    const c = crawl('X', 3)
    expect(sortCrawlsAsc([c, a, b]).map((x) => x.crawl_id)).toEqual(['X-C01', 'X-C02', 'X-C03'])
  })

  it('getLatestCrawl skips a failed newest crawl (F006)', () => {
    expect(getLatestCrawl(f006())?.crawl_id).toBe('F006-C03')
    expect(getNewestCrawl(f006()).crawl_id).toBe('F006-C04')
  })

  it('getLatestCrawl returns null when every crawl failed (F011)', () => {
    expect(getLatestCrawl(f011())).toBeNull()
    expect(getNewestCrawl(f011()).status).toBe('failed')
  })

  it('getLatestCrawl accepts a partial crawl', () => {
    const f = firm('F007', [crawl('F007', 1), crawl('F007', 2, 'partial')], [])
    expect(getLatestCrawl(f)?.crawl_id).toBe('F007-C02')
  })
})

describe('present / removed', () => {
  it('uses the latest non-failed crawl (F006)', () => {
    const f = f006()
    const latest = getLatestCrawl(f)
    expect(isPresent(f.claims[0], latest)).toBe(true)
    expect(isPresent(f.claims[1], latest)).toBe(false)
    expect(isPresent(f.claims[0], null)).toBe(false)
    expect(presentClaims(f).map((c) => c.claim_id)).toEqual(['F006-aaaaaa'])
  })

  it('handles reappearance (F008)', () => {
    const f = f008()
    const r = f.claims[0]
    expect(isPresent(r, getLatestCrawl(f))).toBe(true)
    expect(firstSeen(r, f)).toBe(f.crawls[0].crawled_at)
    expect(lastSeen(r, f)).toBe(f.crawls[3].crawled_at)
    expect(lastSeen(f.claims[1], f)).toBe(f.crawls[2].crawled_at)
    expect(crawlHistory(r, f).map((h) => h.seen)).toEqual([true, true, false, true])
  })

  it('no claims are present without a successful crawl (F011)', () => {
    expect(presentClaims(f011())).toEqual([])
  })
})

describe('counts', () => {
  it('counts present claims by confidence', () => {
    expect(confidenceCounts(f006())).toEqual({ high: 1, medium: 0, low: 0 })
    expect(confidenceCounts(f008())).toEqual({ high: 0, medium: 1, low: 0 })
  })

  it('highestConfidence, including null', () => {
    expect(highestConfidence(f006())).toBe('high')
    expect(highestConfidence(f008())).toBe('medium')
    expect(highestConfidence(f011())).toBeNull()
    const lowOnly = firm('F009', [crawl('F009', 1)], [claim('F009', 'aaaaaa', [1], { confidence: 'low' })])
    expect(highestConfidence(lowOnly)).toBe('low')
  })

  it('stripCounts splits present and removed', () => {
    const f = f006()
    expect(stripCounts(f.claims, f)).toEqual({ total: 2, present: 1, removed: 1 })
  })
})

describe('applyFilters', () => {
  const f = f008()
  it('null means all', () => {
    expect(applyFilters(f.claims, NO_FILTERS)).toHaveLength(2)
  })
  it('ANDs across dimensions', () => {
    expect(applyFilters(f.claims, { ...NO_FILTERS, categories: ['certification'] }).map((c) => c.claim_id)).toEqual(['F008-gggggg'])
    expect(applyFilters(f.claims, { ...NO_FILTERS, confidences: ['medium'] }).map((c) => c.claim_id)).toEqual(['F008-rrrrrr'])
    expect(applyFilters(f.claims, { ...NO_FILTERS, scopes: ['NEEDS_VERIFICATION'], confidences: ['medium'] })).toEqual([])
  })
})

describe('sortForStrip', () => {
  it('present first, then confidence, then category label, then text', () => {
    const id = 'S'
    const f = firm(
      id,
      [crawl(id, 1), crawl(id, 2)],
      [
        claim(id, 'removed', [1], { confidence: 'high' }),
        claim(id, 'lowgg', [1, 2], { confidence: 'low' }),
        claim(id, 'highgg', [1, 2], { confidence: 'high', text: 'Zeta' }),
        claim(id, 'highgg2', [1, 2], { confidence: 'high', text: 'Alfa' }),
        claim(id, 'highcert', [2], { confidence: 'high', category: 'certification', text: 'Zzz' }),
        claim(id, 'med', [2], { confidence: 'medium' }),
      ],
    )
    expect(sortForStrip(f.claims, f).map((c) => c.claim_id.slice(2))).toEqual(['highcert', 'highgg2', 'highgg', 'med', 'lowgg', 'removed'])
  })
})

describe('timelineSeries', () => {
  it('puts null at failed crawls, never 0', () => {
    const id = 'F005'
    const f = firm(id, [crawl(id, 1), crawl(id, 2), crawl(id, 3, 'failed'), crawl(id, 4)], [claim(id, 'aaaaaa', [1, 2, 4])])
    const s = timelineSeries(f, NO_FILTERS, null)
    expect(s.map((p) => p.total)).toEqual([1, 1, null, 1])
    expect(s[2]).toMatchObject({ crawl_id: 'F005-C03', status: 'failed', pages_scraped: 0 })
  })

  it('applies filters to total', () => {
    const f = f008()
    expect(timelineSeries(f, NO_FILTERS, null).map((p) => p.total)).toEqual([2, 2, 1, 1])
    expect(timelineSeries(f, { ...NO_FILTERS, categories: ['certification'] }, null).map((p) => p.total)).toEqual([1, 1, 1, 0])
  })

  it('split counts per category ignore the category filter but apply confidence and scope', () => {
    const f = f008()
    const s = timelineSeries(f, { ...NO_FILTERS, categories: ['certification'] }, ['generic_green', 'certification'])
    expect(s.map((p) => p.generic_green)).toEqual([1, 1, 0, 1])
    expect(s.map((p) => p.certification)).toEqual([1, 1, 1, 0])
    const conf = timelineSeries(f, { ...NO_FILTERS, confidences: ['high'] }, ['generic_green', 'certification'])
    expect(conf.map((p) => p.generic_green)).toEqual([0, 0, 0, 0])
    expect(conf.map((p) => p.certification)).toEqual([1, 1, 1, 0])
    const failed = timelineSeries(f006(), NO_FILTERS, ['generic_green'])
    expect(failed[3].generic_green).toBeNull()
  })
})

describe('categoryBreakdown', () => {
  it('includes every category, counts present only, ignores the category filter', () => {
    const id = 'B'
    const f = firm(
      id,
      [crawl(id, 1), crawl(id, 2)],
      [
        claim(id, 'a', [2], { confidence: 'high' }),
        claim(id, 'b', [2], { confidence: 'low' }),
        claim(id, 'c', [2], { confidence: 'medium', category: 'certification', scope_status: 'NEEDS_VERIFICATION' }),
        claim(id, 'gone', [1], { confidence: 'high' }),
      ],
    )
    const rows = categoryBreakdown(f, { ...NO_FILTERS, categories: ['certification'] }, CATS)
    expect(rows).toEqual([
      { category: 'generic_green', label: 'Generic green', high: 1, medium: 0, low: 1, total: 2 },
      { category: 'certification', label: 'Certification', high: 0, medium: 1, low: 0, total: 1 },
      { category: 'recycled_recyclable', label: 'Recycled / recyclable', high: 0, medium: 0, low: 0, total: 0 },
    ])
    const scoped = categoryBreakdown(f, { ...NO_FILTERS, scopes: ['IN_SCOPE'] }, CATS)
    expect(scoped.map((r) => r.total)).toEqual([2, 0, 0])
  })
})
