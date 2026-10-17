// Deterministic demo data generator (IMPLEMENTATION_PLAN §9.2): one scrape per firm (PLAN v2).
// Usage: npm run fixtures -- [--out data/firms.json]
// Never use Math.random, Date.now() or new Date() without arguments here.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { makeClaimId } from '../src/lib/claimId'
import { areaOf, areaSummaries, claimLight, reviewSummary } from '../src/lib/areas'
import { parseDataFile } from '../src/lib/schema'
import { AREAS, type Claim, type Confidence, type Crawl, type CrawlStatus, type DataFile, type Firm, type Scope } from '../src/lib/types'
import { CATEGORIES, GRAY_ZONES, LEGAL_FORMS, NAME_A, NAME_B, POOL, POST, PRE, SOURCE_PATHS, type PoolEntry } from './fixtures/pools'
import { Rng } from './fixtures/prng'

export const SEED = 20261005
export const GENERATED_AT = '2026-10-12T14:00:00Z'
const FIRM_COUNT = 40
const SCRAPE_WEEK_UTC = Date.UTC(2026, 9, 5) // Mon 5 Oct 2026; one scrape per firm that week
const DAY_MS = 86_400_000
const MAX_ATTEMPTS = 2000

type FirmSpec = {
  status: CrawlStatus
  candidates: number
  accept?: (firm: Firm) => boolean
}

// ---------- special-firm conditions (also used as coverage asserts) ----------

const lights = (f: Firm) => new Set(f.claims.map(claimLight))
const areasWithClaims = (f: Firm) => new Set(f.claims.map((c) => areaOf(c.category)))

const SPECIALS: Record<string, FirmSpec> = {
  F001: {
    status: 'ok',
    candidates: 15,
    accept: (f) => {
      const s = reviewSummary(f)!
      return (
        s.red >= 1 &&
        s.yellow >= 2 &&
        areasWithClaims(f).size >= 4 &&
        f.claims.some((c) => c.scope_status === 'NEEDS_VERIFICATION') &&
        f.claims.some((c) => c.gray_zone !== null) &&
        areaSummaries(f).some((a) => a.claims.length >= 2)
      )
    },
  },
  F002: { status: 'ok', candidates: 6, accept: (f) => f.claims.length > 0 && !lights(f).has('red') },
  F003: { status: 'ok', candidates: 34 },
  F004: { status: 'ok', candidates: 0 },
  F007: { status: 'partial', candidates: 8, accept: (f) => f.claims.length > 0 },
  F011: { status: 'failed', candidates: 0 },
  F012: {
    status: 'ok',
    candidates: 12,
    accept: (f) =>
      f.claims.some((c) => c.legal_ref.ucpd === null && c.legal_ref.codice_consumo === null) &&
      f.claims.some((c) => c.legal_ref.ucpd !== null && c.legal_ref.codice_consumo === null),
  },
}

// ---------- generation ----------

function isoMinute(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z')
}

function makeCrawl(rng: Rng, firmId: string, status: CrawlStatus): Crawl {
  const base = rng.int(15, 120)
  const day = rng.int(0, 4)
  const minute = rng.int(0, 40)
  const pages = status === 'failed' ? 0 : status === 'partial' ? Math.round(base * 0.3) : base
  return {
    crawl_id: `${firmId}-C01`,
    crawled_at: isoMinute(SCRAPE_WEEK_UTC + day * DAY_MS + (9 * 60 + minute) * 60_000),
    pages_scraped: pages,
    status,
  }
}

async function makeClaim(rng: Rng, firmId: string, website: string, entry: PoolEntry, seen: string[]): Promise<Claim> {
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
    confidence: drawnConfidence,
    gray_zone: gray,
    legal_ref,
    seen_in_crawls: seen,
  }
}

async function makeFirm(rng: Rng, firmId: string, firmName: string, website: string, spec: FirmSpec): Promise<Firm> {
  const crawl = makeCrawl(rng, firmId, spec.status)
  const entries = spec.status === 'failed' ? [] : rng.shuffle(POOL).slice(0, spec.candidates)
  const claims: Claim[] = []
  for (const entry of entries) claims.push(await makeClaim(rng, firmId, website, entry, [crawl.crawl_id]))
  claims.sort((a, b) => (a.claim_id < b.claim_id ? -1 : a.claim_id > b.claim_id ? 1 : 0))
  return { firm_id: firmId, firm_name: firmName, website, crawls: [crawl], claims }
}

function randomSpec(rng: Rng): FirmSpec {
  return { status: 'ok', candidates: rng.int(3, 16) }
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
  for (const l of ['red', 'yellow']) atLeast(`light ${l}`, claims.filter((k) => claimLight(k) === l).length, 3)
  for (const a of AREAS) atLeast(`area ${a}`, claims.filter((k) => areaOf(k.category) === a).length, 3)
  atLeast('generic claims made yellow by generic_plus_specific', claims.filter((k) => areaOf(k.category) === 'generic' && k.gray_zone === 'generic_plus_specific' && claimLight(k) === 'yellow').length, 1)
  for (const f of data.firms) if (f.crawls.length !== 1) failures.push(`${f.firm_id}: expected one scrape`)
  for (const s of ['IN_SCOPE', 'NEEDS_VERIFICATION']) atLeast(`scope ${s}`, claims.filter((k) => k.scope_status === s).length, 3)
  for (const g of GRAY_ZONES) atLeast(`gray zone ${g}`, claims.filter((k) => k.gray_zone === g).length, 1)

  const byId = new Map(data.firms.map((f) => [f.firm_id, f]))
  for (const [id, spec] of Object.entries(SPECIALS)) {
    const f = byId.get(id)
    if (!f) {
      failures.push(`${id}: missing`)
      continue
    }
    if (f.crawls[0]?.status !== spec.status) failures.push(`${id}: scrape status differs from spec`)
    if (spec.candidates === 0 && f.claims.length !== 0) failures.push(`${id}: expected no claims`)
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
