import { getLatestCrawl, presentClaims } from './derive'
import { AREAS, type Area, type AreaLight, type Claim, type Filters, type Firm, type Light, type MainArea } from './types'

/** Category → review area (PLAN §2.2). Unknown categories go to `other`. */
export const CATEGORY_AREA: Record<string, MainArea> = {
  generic_green: 'generic',
  undefined_natural: 'generic',
  brand_eco_slogan: 'generic',
  vague_supply_chain: 'scope',
  recycled_recyclable: 'scope',
  vague_comparison: 'evidence',
  risk_reduction: 'evidence',
  certification: 'labels',
  named_endorsement: 'labels',
  climate_neutral: 'labels',
  future_performance: 'future',
}

/** Areas whose IN_SCOPE claims match an outright UCPD Annex I ban (4a, 2a, 4c). */
const BLACKLIST_AREAS: ReadonlySet<Area> = new Set(['generic', 'labels'])

export function areaOf(category: string): Area {
  return Object.hasOwn(CATEGORY_AREA, category) ? CATEGORY_AREA[category] : 'other'
}

/** The claim's own assessment when the data has one, else the fixed rule (PLAN_V2 §3). */
export function claimLight(claim: Claim): Light {
  return claim.review?.light ?? ruleLight(claim)
}

/**
 * Fallback rule. Red: IN_SCOPE in a blacklist area, except generic wording next to a
 * specific explanation (`generic_plus_specific`). Everything else is yellow.
 */
export function ruleLight(claim: Claim): Light {
  const area = areaOf(claim.category)
  if (claim.scope_status !== 'IN_SCOPE' || !BLACKLIST_AREAS.has(area)) return 'yellow'
  if (area === 'generic' && claim.gray_zone === 'generic_plus_specific') return 'yellow'
  return 'red'
}

const AREA_RANK = new Map<Area, number>([...AREAS, 'other'].map((a, i) => [a as Area, i]))
const compareStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Red before yellow, then area order, then text, then claim_id. */
export function sortClaims(claims: readonly Claim[]): Claim[] {
  return [...claims].sort(
    (a, b) =>
      Number(claimLight(a) === 'yellow') - Number(claimLight(b) === 'yellow') ||
      AREA_RANK.get(areaOf(a.category))! - AREA_RANK.get(areaOf(b.category))! ||
      compareStr(a.text, b.text) ||
      compareStr(a.claim_id, b.claim_id),
  )
}

export type AreaSummary = { area: Area; light: AreaLight; claims: Claim[] }

/** The five areas in order, plus `other` when it has claims. Present claims only, sorted. */
export function areaSummaries(firm: Firm): AreaSummary[] {
  const claims = sortClaims(presentClaims(firm))
  const summary = (area: Area): AreaSummary => {
    const own = claims.filter((c) => areaOf(c.category) === area)
    const light: AreaLight = own.length === 0 ? 'green' : own.some((c) => claimLight(c) === 'red') ? 'red' : 'yellow'
    return { area, light, claims: own }
  }
  const out = AREAS.map(summary)
  const other = summary('other')
  return other.claims.length > 0 ? [...out, other] : out
}

export type ReviewSummary = { red: number; yellow: number; green: number; merit: number; lights: AreaLight[] }

/** Counts over the five main areas only; null without a successful crawl (PLAN §3). */
export function reviewSummary(firm: Firm, summaries = areaSummaries(firm)): ReviewSummary | null {
  if (getLatestCrawl(firm) === null) return null
  const lights = summaries.filter((s) => s.area !== 'other').map((s) => s.light)
  const count = (l: AreaLight) => lights.filter((x) => x === l).length
  const red = count('red')
  const yellow = count('yellow')
  return { red, yellow, green: count('green'), merit: red + yellow, lights }
}

/** Default Overview focus: first red area, else first yellow, else the first area. */
export function defaultFocus(summaries: readonly AreaSummary[]): Area {
  return (summaries.find((s) => s.light === 'red') ?? summaries.find((s) => s.light === 'yellow') ?? summaries[0]).area
}

/** AND across dimensions; a null dimension means all. */
export function applyFilters(claims: readonly Claim[], f: Filters): Claim[] {
  return claims.filter(
    (c) =>
      (f.areas === null || f.areas.includes(areaOf(c.category))) &&
      (f.lights === null || f.lights.includes(claimLight(c))) &&
      (f.scopes === null || f.scopes.includes(c.scope_status)),
  )
}
