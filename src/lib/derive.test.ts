import { describe, expect, it } from 'vitest'
import { getLatestCrawl, isPresent, presentClaims, sortCrawlsAsc } from './derive'
import { crawl, f006, f011, firm } from './testData'

describe('crawls', () => {
  it('sorts by date, ties by crawl_id', () => {
    const a = { ...crawl('X', 2), crawled_at: '2026-10-05T09:00:00Z' }
    const b = crawl('X', 1)
    const c = crawl('X', 3)
    expect(sortCrawlsAsc([c, a, b]).map((x) => x.crawl_id)).toEqual(['X-C01', 'X-C02', 'X-C03'])
  })

  it('getLatestCrawl skips a failed newest crawl (F006)', () => {
    expect(getLatestCrawl(f006())?.crawl_id).toBe('F006-C03')
  })

  it('getLatestCrawl returns null when every crawl failed (F011)', () => {
    expect(getLatestCrawl(f011())).toBeNull()
  })

  it('getLatestCrawl accepts a partial crawl', () => {
    const f = firm('F007', [crawl('F007', 1), crawl('F007', 2, 'partial')], [])
    expect(getLatestCrawl(f)?.crawl_id).toBe('F007-C02')
  })
})

describe('present claims', () => {
  it('uses the latest non-failed crawl (F006)', () => {
    const f = f006()
    const latest = getLatestCrawl(f)
    expect(isPresent(f.claims[0], latest)).toBe(true)
    expect(isPresent(f.claims[1], latest)).toBe(false)
    expect(isPresent(f.claims[0], null)).toBe(false)
    expect(presentClaims(f).map((c) => c.claim_id)).toEqual(['F006-aaaaaa'])
  })

  it('no claims are present without a successful crawl (F011)', () => {
    expect(presentClaims(f011())).toEqual([])
  })
})
