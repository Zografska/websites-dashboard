// Hand-written mini fixtures for unit tests (not shipped).
import type { Claim, Crawl, CrawlStatus, DataFile, Firm } from './types'

export const CATS = ['generic_green', 'certification', 'recycled_recyclable']

export function crawl(firmId: string, k: number, status: CrawlStatus = 'ok', day = 5 + 7 * (k - 1)): Crawl {
  const date = new Date(Date.UTC(2026, 9, day, 9, 0, 0)).toISOString().replace('.000Z', 'Z')
  return { crawl_id: `${firmId}-C${String(k).padStart(2, '0')}`, crawled_at: date, pages_scraped: status === 'failed' ? 0 : 40, status }
}

export function claim(firmId: string, suffix: string, seen: number[], over: Partial<Claim> = {}): Claim {
  return {
    claim_id: `${firmId}-${suffix}`,
    text: `Testo ${suffix}`,
    context_snippet: `…prima Testo ${suffix} dopo…`,
    source_url: 'https://www.verdeluce.example/sostenibilita',
    category: 'generic_green',
    scope_status: 'IN_SCOPE',
    confidence: 'high',
    gray_zone: null,
    legal_ref: { ucpd: 'Annex I 4a', codice_consumo: 'Art. 23' },
    seen_in_crawls: seen.map((k) => `${firmId}-C${String(k).padStart(2, '0')}`),
    ...over,
  }
}

export function firm(firmId: string, crawls: Crawl[], claims: Claim[]): Firm {
  return { firm_id: firmId, firm_name: `${firmId} S.r.l.`, website: 'https://www.verdeluce.example', crawls, claims }
}

/** F006 shape: 4 crawls, the newest (C04) failed. a: C01–C03 (present), b: C01–C02 (removed). */
export function f006(): Firm {
  const id = 'F006'
  return firm(
    id,
    [crawl(id, 1), crawl(id, 2), crawl(id, 3), crawl(id, 4, 'failed')],
    [claim(id, 'aaaaaa', [1, 2, 3]), claim(id, 'bbbbbb', [1, 2], { confidence: 'low' })],
  )
}

/** F008 shape: 4 ok crawls; claim r is seen in C01, C02 and C04 but not C03. */
export function f008(): Firm {
  const id = 'F008'
  return firm(
    id,
    [crawl(id, 1), crawl(id, 2), crawl(id, 3), crawl(id, 4)],
    [
      claim(id, 'rrrrrr', [1, 2, 4], { confidence: 'medium' }),
      claim(id, 'gggggg', [1, 2, 3], { category: 'certification', scope_status: 'NEEDS_VERIFICATION' }),
    ],
  )
}

/** F011 shape: 2 crawls, both failed, no claims. */
export function f011(): Firm {
  const id = 'F011'
  return firm(id, [crawl(id, 1, 'failed'), crawl(id, 2, 'failed')], [])
}

export function dataFile(firms: Firm[] = [f006(), f008(), f011()]): DataFile {
  return { schema_version: '1.0', generated_at: '2026-11-02T14:00:00Z', categories: [...CATS], firms }
}
