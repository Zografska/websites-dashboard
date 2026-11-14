import { getLatestCrawl, presentClaims } from './derive'
import { AREAS, type Area, type AreaLight, type Claim, type Filters, type Firm, type Light, type MainArea } from './types'

/** Category → review area (PLAN §2.2). Unknown categories go to `other`. */
export const CATEGORY_AREA: Record<string, MainArea> = {
  generic_green: 'generic',
  undefined_natural: 'generic',
  brand_eco_slogan: 'generic',
  legal_requirement_as_feature: 'generic',
  vague_supply_chain: 'scope',
  recycled_recyclable: 'scope',
  part_for_whole: 'scope',
  renewable_energy: 'scope',
  biodegradable: 'scope',
  pollutant_free: 'scope',
  farming_practice: 'scope',
  vegan: 'scope',
  defined_term: 'scope',
  vague_comparison: 'evidence',
  risk_reduction: 'evidence',
  named_comparison: 'evidence',
  resource_efficiency: 'evidence',
  certification: 'labels',
  named_endorsement: 'labels',
  climate_neutral: 'labels',
  future_performance: 'future',
}

/** Categories whose claims are red when no per-claim review is present. */
const RED_CATEGORIES: ReadonlySet<string> = new Set([
  'generic_green',
  'undefined_natural',
  'brand_eco_slogan',
  'vague_supply_chain',
  'climate_neutral',
  'part_for_whole',
  'legal_requirement_as_feature',
])

export function areaOf(category: string): Area {
  return Object.hasOwn(CATEGORY_AREA, category) ? CATEGORY_AREA[category] : 'other'
}

/** The claim's own assessment when the data has one, else the fixed rule (PLAN_V2 §3). */
export function claimLight(claim: Claim): Light {
  return claim.review?.light ?? ruleLight(claim)
}

/** Fallback rule (the data's `review.light` normally decides): red for the categories above, else yellow. */
export function ruleLight(claim: Claim): Light {
  return RED_CATEGORIES.has(claim.category) ? 'red' : 'yellow'
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
