import { z } from 'zod'

export const Confidence = z.enum(['high', 'medium', 'low'])
export const Scope = z.enum(['IN_SCOPE', 'NEEDS_VERIFICATION'])
export const CrawlStatus = z.enum(['ok', 'partial', 'failed'])
export const Light = z.enum(['red', 'yellow'])

/** Advice for one claim in one language (PLAN_V2 §4). */
export const ClaimAdvice = z.object({
  reason: z.string().min(1),
  why: z.string().min(1),
  verify: z.array(z.string().min(1)).min(1),
  action: z.string().min(1),
})

/** Optional per-claim assessment: when present it sets the claim's colour and advice (PLAN_V2 §3–4). */
export const ClaimReview = z.object({
  light: Light,
  en: ClaimAdvice,
  it: ClaimAdvice,
})
const IsoDateTime = z.iso.datetime({ offset: true })
const HttpUrl = z.url().refine((u) => /^https?:\/\//.test(u), 'must be http(s)')

export const Crawl = z.object({
  crawl_id: z.string().min(1),
  crawled_at: IsoDateTime,
  pages_scraped: z.number().int().min(0),
  status: CrawlStatus,
})

export const Claim = z.object({
  claim_id: z.string().min(1),
  text: z.string().min(1),
  context_snippet: z.string(), // may be ""
  source_url: HttpUrl,
  category: z.string().min(1),
  scope_status: Scope,
  confidence: Confidence,
  gray_zone: z.string().min(1).nullable(),
  legal_ref: z.object({
    ucpd: z.string().min(1).nullable(),
    codice_consumo: z.string().min(1).nullable(),
  }),
  seen_in_crawls: z.array(z.string().min(1)).min(1),
  review: ClaimReview.optional(),
})

export const Firm = z.object({
  firm_id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  firm_name: z.string().min(1),
  website: HttpUrl,
  crawls: z.array(Crawl).min(1),
  claims: z.array(Claim),
})

type DataFileShape = {
  categories: string[]
  firms: z.infer<typeof Firm>[]
}

/** Cross-field checks (IMPLEMENTATION_PLAN §4.1), one issue per violation. */
function crossChecks(data: DataFileShape, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

  const categories = new Set<string>()
  data.categories.forEach((c, i) => {
    if (categories.has(c)) issue(['categories', i], `duplicate category ${c}`)
    categories.add(c)
  })

  const firmIds = new Set<string>()
  data.firms.forEach((firm, fi) => {
    if (firmIds.has(firm.firm_id)) issue(['firms', fi, 'firm_id'], `duplicate firm_id ${firm.firm_id}`)
    firmIds.add(firm.firm_id)

    const crawlStatus = new Map<string, string>()
    firm.crawls.forEach((crawl, ci) => {
      if (crawlStatus.has(crawl.crawl_id)) issue(['firms', fi, 'crawls', ci, 'crawl_id'], `duplicate crawl_id ${crawl.crawl_id}`)
      crawlStatus.set(crawl.crawl_id, crawl.status)
    })

    const claimIds = new Set<string>()
    firm.claims.forEach((claim, ki) => {
      const base = ['firms', fi, 'claims', ki]
      if (claimIds.has(claim.claim_id)) issue([...base, 'claim_id'], `duplicate claim_id ${claim.claim_id}`)
      claimIds.add(claim.claim_id)
      if (!claim.claim_id.startsWith(`${firm.firm_id}-`)) {
        issue([...base, 'claim_id'], `claim_id must start with ${firm.firm_id}-`)
      }
      if (!categories.has(claim.category)) issue([...base, 'category'], `unknown category ${claim.category}`)

      const seen = new Set<string>()
      claim.seen_in_crawls.forEach((id, si) => {
        const path = [...base, 'seen_in_crawls', si]
        const status = crawlStatus.get(id)
        if (status === undefined) issue(path, `unknown crawl ${id}`)
        else if (status === 'failed') issue(path, `claim seen in failed crawl ${id}`)
        if (seen.has(id)) issue(path, `duplicate crawl ${id}`)
        seen.add(id)
      })
    })
  })
}

export const DataFile = z
  .object({
    schema_version: z.string().regex(/^1\.\d+$/),
    generated_at: IsoDateTime,
    categories: z.array(z.string().regex(/^[a-z0-9_]+$/)).min(1),
    firms: z.array(Firm),
  })
  .superRefine(crossChecks)

export type DataIssue = { path: string; message: string }
export type ParseResult = { ok: true; data: z.infer<typeof DataFile> } | { ok: false; issues: DataIssue[] }

/** Renders a zod path as `firms[3].claims[12].category`. */
export function formatPath(path: readonly PropertyKey[]): string {
  let out = ''
  for (const seg of path) {
    if (typeof seg === 'number') out += `[${seg}]`
    else out += out === '' ? String(seg) : `.${String(seg)}`
  }
  return out || '(root)'
}

export function parseDataFile(json: unknown): ParseResult {
  const result = DataFile.safeParse(json)
  if (result.success) return { ok: true, data: result.data }
  return {
    ok: false,
    issues: result.error.issues.map((i) => ({ path: formatPath(i.path), message: i.message })),
  }
}
