import { categoryLabel } from './categories'
import type { Claim, Confidence, Crawl, CrawlStatus, Filters, Firm } from './types'

const time = (iso: string) => Date.parse(iso)

/** By crawled_at, ties by crawl_id. */
export function sortCrawlsAsc(crawls: readonly Crawl[]): Crawl[] {
  return [...crawls].sort((a, b) => time(a.crawled_at) - time(b.crawled_at) || (a.crawl_id < b.crawl_id ? -1 : a.crawl_id > b.crawl_id ? 1 : 0))
}

/** Newest crawl whose status isn't `failed` (D1); null if every crawl failed. */
export function getLatestCrawl(firm: Firm): Crawl | null {
  const ok = sortCrawlsAsc(firm.crawls).filter((c) => c.status !== 'failed')
  return ok.at(-1) ?? null
}

/** Newest crawl of any status (D2). */
export function getNewestCrawl(firm: Firm): Crawl {
  return sortCrawlsAsc(firm.crawls).at(-1)!
}

export function isPresent(claim: Claim, latest: Crawl | null): boolean {
  return latest !== null && claim.seen_in_crawls.includes(latest.crawl_id)
}

function seenCrawlsAsc(claim: Claim, firm: Firm): Crawl[] {
  const seen = new Set(claim.seen_in_crawls)
  return sortCrawlsAsc(firm.crawls).filter((c) => seen.has(c.crawl_id))
}

export function firstSeen(claim: Claim, firm: Firm): string {
  return seenCrawlsAsc(claim, firm)[0].crawled_at
}

export function lastSeen(claim: Claim, firm: Firm): string {
  return seenCrawlsAsc(claim, firm).at(-1)!.crawled_at
}

export function presentClaims(firm: Firm): Claim[] {
  const latest = getLatestCrawl(firm)
  return firm.claims.filter((c) => isPresent(c, latest))
}

/** Present claims only, unfiltered. */
export function confidenceCounts(firm: Firm): Record<Confidence, number> {
  const counts = { high: 0, medium: 0, low: 0 }
  for (const c of presentClaims(firm)) counts[c.confidence]++
  return counts
}

export function highestConfidence(firm: Firm): Confidence | null {
  const counts = confidenceCounts(firm)
  if (counts.high > 0) return 'high'
  if (counts.medium > 0) return 'medium'
  if (counts.low > 0) return 'low'
  return null
}

function passesConfScope(claim: Claim, f: Filters): boolean {
  return (f.confidences === null || f.confidences.includes(claim.confidence)) && (f.scopes === null || f.scopes.includes(claim.scope_status))
}

/** AND across dimensions; a null dimension means all. */
export function applyFilters(claims: readonly Claim[], f: Filters): Claim[] {
  return claims.filter((c) => (f.categories === null || f.categories.includes(c.category)) && passesConfScope(c, f))
}

const CONF_RANK: Record<Confidence, number> = { high: 0, medium: 1, low: 2 }
const compareStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Present first; then high > medium > low; then category label A–Z; then text A–Z; then claim_id. */
export function sortForStrip(claims: readonly Claim[], firm: Firm): Claim[] {
  const latest = getLatestCrawl(firm)
  return [...claims].sort(
    (a, b) =>
      Number(isPresent(b, latest)) - Number(isPresent(a, latest)) ||
      CONF_RANK[a.confidence] - CONF_RANK[b.confidence] ||
      compareStr(categoryLabel(a.category), categoryLabel(b.category)) ||
      compareStr(a.text, b.text) ||
      compareStr(a.claim_id, b.claim_id),
  )
}

export function stripCounts(claims: readonly Claim[], firm: Firm): { total: number; present: number; removed: number } {
  const latest = getLatestCrawl(firm)
  const present = claims.filter((c) => isPresent(c, latest)).length
  return { total: claims.length, present, removed: claims.length - present }
}

export type TimelinePoint = {
  crawl_id: string
  crawled_at: string
  status: CrawlStatus
  pages_scraped: number
  total: number | null
  /** One key per split category: count, or null at a failed crawl. */
  [category: string]: string | number | null
}

/**
 * One point per crawl (asc). Failed crawls are gaps (null), never 0.
 * `total` applies all filters; each split category applies only the confidence and scope filters.
 */
export function timelineSeries(firm: Firm, filters: Filters, splitCategories: string[] | null): TimelinePoint[] {
  const filtered = applyFilters(firm.claims, filters)
  const confScope = firm.claims.filter((c) => passesConfScope(c, filters))
  return sortCrawlsAsc(firm.crawls).map((crawl) => {
    const failed = crawl.status === 'failed'
    const seenIn = (c: Claim) => c.seen_in_crawls.includes(crawl.crawl_id)
    const point: TimelinePoint = {
      crawl_id: crawl.crawl_id,
      crawled_at: crawl.crawled_at,
      status: crawl.status,
      pages_scraped: crawl.pages_scraped,
      total: failed ? null : filtered.filter(seenIn).length,
    }
    for (const cat of splitCategories ?? []) {
      point[cat] = failed ? null : confScope.filter((c) => c.category === cat && seenIn(c)).length
    }
    return point
  })
}

export type BreakdownRow = { category: string; label: string; high: number; medium: number; low: number; total: number }

/** One row per category (in order), present claims only; ignores the category filter. */
export function categoryBreakdown(firm: Firm, filters: Filters, categories: readonly string[]): BreakdownRow[] {
  const present = presentClaims(firm).filter((c) => passesConfScope(c, filters))
  return categories.map((category) => {
    const row: BreakdownRow = { category, label: categoryLabel(category), high: 0, medium: 0, low: 0, total: 0 }
    for (const c of present) {
      if (c.category !== category) continue
      row[c.confidence]++
      row.total++
    }
    return row
  })
}

/** Every crawl of the firm, ascending, marked seen or not. */
export function crawlHistory(claim: Claim, firm: Firm): { crawl: Crawl; seen: boolean }[] {
  return sortCrawlsAsc(firm.crawls).map((crawl) => ({ crawl, seen: claim.seen_in_crawls.includes(crawl.crawl_id) }))
}
