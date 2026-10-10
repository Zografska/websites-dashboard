// Deterministic demo data generator (IMPLEMENTATION_PLAN §9.2).
// Usage: npm run fixtures -- [--out data/firms.json]
// Never use Math.random, Date.now() or new Date() without arguments here.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { makeClaimId } from '../src/lib/claimId'
import { getLatestCrawl, isPresent, presentClaims, sortCrawlsAsc } from '../src/lib/derive'
import { parseDataFile } from '../src/lib/schema'
import type { Claim, Confidence, Crawl, CrawlStatus, DataFile, Firm, Scope } from '../src/lib/types'
import { CATEGORIES, GRAY_ZONES, LEGAL_FORMS, NAME_A, NAME_B, POOL, POST, PRE, SOURCE_PATHS, type PoolEntry } from './fixtures/pools'
import { Rng } from './fixtures/prng'

export const SEED = 20261005
export const GENERATED_AT = '2026-11-02T14:00:00Z'
const FIRM_COUNT = 40
const FIRST_CRAWL_UTC = Date.UTC(2026, 9, 5) // Mon 5 Oct 2026
const DAY_MS = 86_400_000
const MAX_ATTEMPTS = 2000

type Presence = { initial: number; remove: number; reappear: number; appear: number }
const DEFAULT_PRESENCE: Presence = { initial: 0.7, remove: 0.12, reappear: 0.25, appear: 0.15 }

type FirmSpec = {
  statuses: CrawlStatus[]
  candidates: number
  presence?: Presence
  confidence?: Confidence // force every claim to this level
  accept?: (firm: Firm) => boolean
}

const okCrawls = (n: number): CrawlStatus[] => Array.from({ length: n }, () => 'ok')

// ---------- special-firm conditions (also used as coverage asserts) ----------

const removedInLatest = (f: Firm) => {
  const latest = getLatestCrawl(f)
  return f.claims.filter((c) => !isPresent(c, latest))
}

/** A claim seen, then not seen in a non-failed crawl, then seen again. */
const hasReappearance = (f: Firm) => {
  const crawls = sortCrawlsAsc(f.crawls).filter((c) => c.status !== 'failed')
  return f.claims.some((claim) => {
    const pattern = crawls.map((c) => (claim.seen_in_crawls.includes(c.crawl_id) ? '1' : '0')).join('')
    return /10+1/.test(pattern)
  })
}

const statusesAre = (f: Firm, statuses: CrawlStatus[]) =>
  f.crawls.length === statuses.length && sortCrawlsAsc(f.crawls).every((c, i) => c.status === statuses[i])

const seenExactly = (f: Firm, claim: Claim, ks: number[]) =>
  claim.seen_in_crawls.join(',') === ks.map((k) => crawlId(f.firm_id, k)).join(',')

const SPECIALS: Record<string, FirmSpec> = {
  F001: {
    statuses: okCrawls(5),
    candidates: 15,
    accept: (f) =>
      removedInLatest(f).length >= 2 &&
      hasReappearance(f) &&
      f.claims.some((c) => c.scope_status === 'NEEDS_VERIFICATION') &&
      f.claims.some((c) => c.gray_zone !== null) &&
      (['high', 'medium', 'low'] as const).every((lvl) => f.claims.some((c) => c.confidence === lvl)),
  },
  F002: { statuses: okCrawls(1), candidates: 6, presence: { ...DEFAULT_PRESENCE, initial: 1 }, accept: (f) => f.claims.length === 6 },
  F003: {
    statuses: okCrawls(5),
    candidates: 34,
    presence: { initial: 0.9, remove: 0.03, reappear: 0.6, appear: 0.6 },
    accept: (f) => presentClaims(f).length >= 30,
  },
  F004: { statuses: okCrawls(3), candidates: 0 },
  F005: { statuses: ['ok', 'ok', 'failed', 'ok'], candidates: 10, accept: (f) => f.claims.length > 0 },
  F006: {
    statuses: ['ok', 'ok', 'ok', 'failed'],
    candidates: 10,
    accept: (f) => presentClaims(f).length > 0 && removedInLatest(f).length > 0,
  },
  F007: { statuses: ['ok', 'ok', 'partial'], candidates: 10, accept: (f) => presentClaims(f).length > 0 },
  F008: {
    statuses: okCrawls(4),
    candidates: 10,
    accept: (f) => f.claims.some((c) => seenExactly(f, c, [1, 2, 4])),
  },
  F009: { statuses: okCrawls(3), candidates: 6, confidence: 'low', accept: (f) => presentClaims(f).length > 0 },
  F010: { statuses: okCrawls(3), candidates: 6, confidence: 'medium', accept: (f) => presentClaims(f).length > 0 },
  F011: { statuses: ['failed', 'failed'], candidates: 0 },
  F012: {
    statuses: okCrawls(2),
    candidates: 12,
    accept: (f) =>
      f.claims.some((c) => c.legal_ref.ucpd === null && c.legal_ref.codice_consumo === null) &&
      f.claims.some((c) => c.legal_ref.ucpd !== null && c.legal_ref.codice_consumo === null),
  },
}

// ---------- generation ----------

function crawlId(firmId: string, k: number): string {
  return `${firmId}-C${String(k).padStart(2, '0')}`
}

function isoMinute(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z')
}

function makeCrawls(rng: Rng, firmId: string, statuses: CrawlStatus[]): Crawl[] {
  const base = rng.int(15, 120)
  return statuses.map((status, i) => {
    const k = i + 1
    const minute = rng.int(0, 40)
    const drift = rng.int(-5, 5)
    const pages = status === 'failed' ? 0 : status === 'partial' ? Math.round(base * 0.3) : Math.max(1, base + drift)
    return {
      crawl_id: crawlId(firmId, k),
      crawled_at: isoMinute(FIRST_CRAWL_UTC + 7 * (k - 1) * DAY_MS + (9 * 60 + minute) * 60_000),
      pages_scraped: pages,
      status,
    }
  })
}

/** Simulates presence crawl by crawl; returns the crawl ids each candidate was seen in. */
function simulate(rng: Rng, crawls: Crawl[], candidates: number, p: Presence): string[][] {
  const seen: string[][] = Array.from({ length: candidates }, () => [])
  const present = new Array<boolean>(candidates).fill(false)
  let first = true
  for (const crawl of crawls) {
    if (crawl.status === 'failed') continue // nothing seen; state carries over
    for (let i = 0; i < candidates; i++) {
      if (first) present[i] = rng.chance(p.initial)
      else if (present[i]) present[i] = !rng.chance(p.remove)
      else if (seen[i].length > 0) present[i] = rng.chance(p.reappear)
      else present[i] = rng.chance(p.appear)
      if (present[i]) seen[i].push(crawl.crawl_id)
    }
    first = false
  }
  return seen
}

async function makeClaim(rng: Rng, firmId: string, website: string, entry: PoolEntry, seen: string[], forced?: Confidence): Promise<Claim> {
  const drawnConfidence = rng.weighted<Confidence>([
    ['high', 35],
    ['medium', 40],
    ['low', 25],
  ])
  const scope = rng.weighted<Scope>([
    ['IN_SCOPE', 75],
    ['NEEDS_VERIFICATION', 25],
  ])
  const gray = rng.chance(0.85) ? null : rng.pick(GRAY_ZONES)
  const legalRoll = rng.float()
  const legal_ref =
    legalRoll < 0.08
      ? { ucpd: null, codice_consumo: null }
      : legalRoll < 0.15
        ? { ucpd: entry.legal_ref.ucpd, codice_consumo: null }
        : { ...entry.legal_ref }
  const sourcePath = rng.pick(SOURCE_PATHS)
  const pre = rng.pick(PRE)
  const post = rng.pick(POST)
  const snippet = rng.chance(0.05) ? '' : `…${pre} ${entry.text} ${post}…`
  return {
    claim_id: await makeClaimId(firmId, entry.text),
    text: entry.text,
    context_snippet: snippet,
    source_url: sourcePath === '/' ? `${website}/` : `${website}${sourcePath}`,
    category: entry.category,
    scope_status: scope,
    confidence: forced ?? drawnConfidence,
    gray_zone: gray,
    legal_ref,
    seen_in_crawls: seen,
  }
}

async function makeFirm(rng: Rng, firmId: string, firmName: string, website: string, spec: FirmSpec): Promise<Firm> {
  const crawls = makeCrawls(rng, firmId, spec.statuses)
  const entries = rng.shuffle(POOL).slice(0, spec.candidates)
  const seen = simulate(rng, crawls, entries.length, spec.presence ?? DEFAULT_PRESENCE)
  const claims: Claim[] = []
  for (let i = 0; i < entries.length; i++) {
    const claim = await makeClaim(rng, firmId, website, entries[i], seen[i], spec.confidence)
    if (seen[i].length > 0) claims.push(claim) // claims never seen are dropped
  }
  claims.sort((a, b) => (a.claim_id < b.claim_id ? -1 : a.claim_id > b.claim_id ? 1 : 0))
  return { firm_id: firmId, firm_name: firmName, website, crawls: sortCrawlsAsc(crawls), claims }
}

function randomSpec(rng: Rng): FirmSpec {
  return { statuses: okCrawls(rng.int(1, 5)), candidates: rng.int(4, 18) }
}

export async function generateFixtures(): Promise<DataFile> {
  const rng = new Rng(SEED)
  const combos = NAME_A.flatMap((a) => NAME_B.map((b) => `${a}${b}`))
  const names = rng.shuffle(combos).slice(0, FIRM_COUNT)

  const firms: Firm[] = []
  for (let i = 0; i < FIRM_COUNT; i++) {
    const firmId = `F${String(i + 1).padStart(3, '0')}`
    const base = names[i]
    const firmName = `${base} ${rng.pick(LEGAL_FORMS)}`
    const website = `https://www.${base.toLowerCase()}.example`
    const spec = SPECIALS[firmId] ?? randomSpec(rng)
    let firm: Firm | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = await makeFirm(rng, firmId, firmName, website, spec)
      if (!spec.accept || spec.accept(candidate)) {
        firm = candidate
        break
      }
    }
    if (!firm) throw new Error(`${firmId}: no attempt met its special conditions`)
    firms.push(firm)
  }

  const data: DataFile = { schema_version: '1.0', generated_at: GENERATED_AT, categories: [...CATEGORIES], firms }
  const failures = coverageFailures(data)
  if (failures.length > 0) throw new Error(`Fixture coverage asserts failed:\n  ${failures.join('\n  ')}`)
  return data
}

/** Every "Coverage asserts" item of §9.2; returns human-readable failures (empty = all pass). */
export function coverageFailures(data: DataFile): string[] {
  const failures: string[] = []
  const parsed = parseDataFile(data)
  if (!parsed.ok) failures.push(...parsed.issues.map((i) => `schema: ${i.path}: ${i.message}`))

  if (data.firms.length !== FIRM_COUNT) failures.push(`expected ${FIRM_COUNT} firms, got ${data.firms.length}`)
  const claims = data.firms.flatMap((f) => f.claims)
  const atLeast = (label: string, n: number, min: number) => {
    if (n < min) failures.push(`${label}: ${n} < ${min}`)
  }
  for (const c of data.categories) atLeast(`category ${c}`, claims.filter((k) => k.category === c).length, 3)
  for (const c of ['high', 'medium', 'low']) atLeast(`confidence ${c}`, claims.filter((k) => k.confidence === c).length, 3)
  for (const s of ['IN_SCOPE', 'NEEDS_VERIFICATION']) atLeast(`scope ${s}`, claims.filter((k) => k.scope_status === s).length, 3)
  for (const g of GRAY_ZONES) atLeast(`gray zone ${g}`, claims.filter((k) => k.gray_zone === g).length, 1)
  atLeast('claims removed in latest crawl', data.firms.reduce((n, f) => n + removedInLatest(f).length, 0), 10)

  const byId = new Map(data.firms.map((f) => [f.firm_id, f]))
  for (const [id, spec] of Object.entries(SPECIALS)) {
    const f = byId.get(id)
    if (!f) {
      failures.push(`${id}: missing`)
      continue
    }
    if (!statusesAre(f, spec.statuses)) failures.push(`${id}: crawl statuses differ from spec`)
    if (spec.candidates === 0 && f.claims.length !== 0) failures.push(`${id}: expected no claims`)
    if (spec.confidence && !f.claims.every((c) => c.confidence === spec.confidence)) failures.push(`${id}: expected all ${spec.confidence}`)
    if (spec.accept && !spec.accept(f)) failures.push(`${id}: special conditions not met`)
  }

  for (const f of data.firms) {
    const ids = f.claims.map((c) => c.claim_id)
    if (new Set(ids).size !== ids.length) failures.push(`${f.firm_id}: duplicate claim IDs`)
  }
  return failures
}

export function serialize(data: DataFile): string {
  return JSON.stringify(data, null, 2) + '\n'
}

async function main() {
  const args = process.argv.slice(2)
  const outIdx = args.indexOf('--out')
  const out = outIdx >= 0 ? args[outIdx + 1] : 'data/firms.json'
  if (!out) throw new Error('--out needs a path')
  const data = await generateFixtures()
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
  writeFileSync(out, serialize(data))
  const claims = data.firms.reduce((n, f) => n + f.claims.length, 0)
  console.log(`Wrote ${data.firms.length} firms, ${claims} claims → ${out}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
