import { describe, expect, it } from 'vitest'
import { applyFilters, areaOf, areaSummaries, claimLight, defaultFocus, reviewSummary, sortClaims } from './areas'
import { NO_FILTERS } from './filters'
import { claim, crawl, f011, firm } from './testData'

const c = (suffix: string, over: Parameters<typeof claim>[3] = {}) => claim('F1', suffix, [1], over)

describe('areaOf', () => {
  it('maps known categories and sends unknown ones to other', () => {
    expect(areaOf('generic_green')).toBe('generic')
    expect(areaOf('brand_eco_slogan')).toBe('generic')
    expect(areaOf('recycled_recyclable')).toBe('scope')
    expect(areaOf('vague_comparison')).toBe('evidence')
    expect(areaOf('climate_neutral')).toBe('labels')
    expect(areaOf('future_performance')).toBe('future')
    expect(areaOf('environmental_comparison')).toBe('other')
    expect(areaOf('toString')).toBe('other')
  })
})

describe('claimLight (PLAN §3)', () => {
  it('IN_SCOPE in generic or labels is red', () => {
    expect(claimLight(c('a', { category: 'generic_green' }))).toBe('red')
    expect(claimLight(c('b', { category: 'climate_neutral' }))).toBe('red')
    expect(claimLight(c('c', { category: 'certification' }))).toBe('red')
  })
  it('NEEDS_VERIFICATION is always yellow', () => {
    expect(claimLight(c('a', { category: 'generic_green', scope_status: 'NEEDS_VERIFICATION' }))).toBe('yellow')
    expect(claimLight(c('b', { category: 'certification', scope_status: 'NEEDS_VERIFICATION' }))).toBe('yellow')
  })
  it('IN_SCOPE outside the blacklist areas is yellow', () => {
    for (const category of ['vague_supply_chain', 'vague_comparison', 'future_performance', 'unknown_thing']) {
      expect(claimLight(c('a', { category }))).toBe('yellow')
    }
  })
  it('generic wording next to a specific explanation is yellow', () => {
    expect(claimLight(c('a', { category: 'generic_green', gray_zone: 'generic_plus_specific' }))).toBe('yellow')
    expect(claimLight(c('b', { category: 'certification', gray_zone: 'generic_plus_specific' }))).toBe('red')
    expect(claimLight(c('c', { category: 'generic_green', gray_zone: 'natural_footnote' }))).toBe('red')
  })
})

describe('sortClaims', () => {
  it('red first, then area order, then text', () => {
    const claims = [
      c('a', { category: 'vague_comparison', text: 'A' }),
      c('b', { category: 'vague_supply_chain', text: 'B' }),
      c('c', { category: 'certification', text: 'C' }),
      c('d', { category: 'generic_green', text: 'D' }),
      c('e', { category: 'vague_supply_chain', text: 'A' }),
    ]
    expect(sortClaims(claims).map((x) => x.claim_id)).toEqual(['F1-d', 'F1-c', 'F1-e', 'F1-b', 'F1-a'])
  })
})

describe('areaSummaries and reviewSummary', () => {
  const f = firm('F1', [crawl('F1', 1)], [
    c('a', { category: 'generic_green' }),
    c('b', { category: 'generic_green', scope_status: 'NEEDS_VERIFICATION' }),
    c('c', { category: 'vague_supply_chain' }),
    c('d', { category: 'risk_reduction' }),
    claim('F1', 'e', [], { category: 'certification' }), // not seen in the latest crawl
  ])

  it('colours each area by its most serious present claim', () => {
    const s = areaSummaries(f)
    expect(s.map((x) => [x.area, x.light, x.claims.length])).toEqual([
      ['generic', 'red', 2],
      ['scope', 'yellow', 1],
      ['evidence', 'yellow', 1],
      ['labels', 'green', 0],
      ['future', 'green', 0],
    ])
  })

  it('adds other only when it has claims, and never counts it', () => {
    const g = firm('F2', [crawl('F2', 1)], [claim('F2', 'x', [1], { category: 'mystery' })])
    const s = areaSummaries(g)
    expect(s.at(-1)).toMatchObject({ area: 'other', light: 'yellow' })
    expect(reviewSummary(g, s)).toMatchObject({ merit: 0, green: 5 })
  })

  it('counts areas that merit review', () => {
    expect(reviewSummary(f)).toEqual({ red: 1, yellow: 2, green: 2, merit: 3, lights: ['red', 'yellow', 'yellow', 'green', 'green'] })
  })

  it('is null without a successful crawl', () => {
    expect(reviewSummary(f011())).toBeNull()
  })

  it('defaultFocus prefers red, then yellow, then the first area', () => {
    expect(defaultFocus(areaSummaries(f))).toBe('generic')
    const yellowOnly = firm('F3', [crawl('F3', 1)], [claim('F3', 'y', [1], { category: 'recycled_recyclable' })])
    expect(defaultFocus(areaSummaries(yellowOnly))).toBe('scope')
    expect(defaultFocus(areaSummaries(firm('F4', [crawl('F4', 1)], [])))).toBe('generic')
  })
})

describe('applyFilters', () => {
  const claims = [
    c('a', { category: 'generic_green' }),
    c('b', { category: 'generic_green', scope_status: 'NEEDS_VERIFICATION' }),
    c('c', { category: 'vague_supply_chain' }),
  ]
  it('null dimensions mean all', () => expect(applyFilters(claims, NO_FILTERS)).toHaveLength(3))
  it('ANDs area, light and scope', () => {
    expect(applyFilters(claims, { ...NO_FILTERS, areas: ['generic'] }).map((x) => x.claim_id)).toEqual(['F1-a', 'F1-b'])
    expect(applyFilters(claims, { ...NO_FILTERS, lights: ['yellow'] }).map((x) => x.claim_id)).toEqual(['F1-b', 'F1-c'])
    expect(applyFilters(claims, { areas: ['generic'], lights: ['yellow'], scopes: ['IN_SCOPE'] })).toEqual([])
  })
})
