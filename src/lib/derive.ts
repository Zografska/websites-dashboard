import type { Claim, Crawl, Firm } from './types'

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

export function isPresent(claim: Claim, latest: Crawl | null): boolean {
  return latest !== null && claim.seen_in_crawls.includes(latest.crawl_id)
}

/** Claims seen in the latest successful crawl: with one scrape per firm, every claim. */
export function presentClaims(firm: Firm): Claim[] {
  const latest = getLatestCrawl(firm)
  return firm.claims.filter((c) => isPresent(c, latest))
}
