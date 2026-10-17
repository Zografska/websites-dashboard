import { describe, expect, it } from 'vitest'
import { hasActiveFilters, NO_FILTERS, parseFilters, selectionFromControl, toSearch, withParam, withParams, writeFilters } from './filters'
import { AREAS, type Area, type Filters } from './types'

const sp = (s: string) => new URLSearchParams(s)
const FIVE: readonly Area[] = AREAS
const SIX: readonly Area[] = [...AREAS, 'other']

describe('parseFilters', () => {
  it('reads all three params', () => {
    expect(parseFilters(sp('area=labels,generic&light=red&scope=IN_SCOPE'), FIVE)).toEqual({
      areas: ['generic', 'labels'],
      lights: ['red'],
      scopes: ['IN_SCOPE'],
    })
  })

  it('drops unknown values and duplicates, trims', () => {
    expect(parseFilters(sp('area= scope ,nope,scope&light=green,yellow,yellow'), FIVE)).toEqual({
      areas: ['scope'],
      lights: ['yellow'],
      scopes: null,
    })
  })

  it('only accepts other when the firm has it', () => {
    expect(parseFilters(sp('area=other'), FIVE).areas).toBeNull()
    expect(parseFilters(sp('area=other'), SIX).areas).toEqual(['other'])
  })

  it('maps missing, empty, all-unknown and full selections to null', () => {
    expect(parseFilters(sp(''), FIVE)).toEqual(NO_FILTERS)
    expect(parseFilters(sp('area=&light=nope'), FIVE)).toEqual(NO_FILTERS)
    expect(parseFilters(sp('light=yellow,red&scope=NEEDS_VERIFICATION,IN_SCOPE'), FIVE)).toEqual(NO_FILTERS)
  })

  it('ignores v1 params', () => {
    expect(parseFilters(sp('cat=generic_green&conf=high'), FIVE)).toEqual(NO_FILTERS)
  })
})

describe('writeFilters', () => {
  it('writes canonical order and keeps other params', () => {
    const f: Filters = { areas: ['evidence', 'generic'], lights: ['yellow'], scopes: ['NEEDS_VERIFICATION'] }
    const out = writeFilters(sp('claim=F001-abcdef&tab=claims'), f, FIVE)
    expect(out.get('area')).toBe('generic,evidence')
    expect(out.get('light')).toBe('yellow')
    expect(out.get('scope')).toBe('NEEDS_VERIFICATION')
    expect(out.get('claim')).toBe('F001-abcdef')
    expect(out.get('tab')).toBe('claims')
  })

  it('removes params for null and full sets, and returns a copy', () => {
    const input = sp('area=scope&light=red&claim=F001-abcdef')
    const out = writeFilters(input, { areas: [...FIVE], lights: null, scopes: ['IN_SCOPE', 'NEEDS_VERIFICATION'] }, FIVE)
    expect(out.toString()).toBe('claim=F001-abcdef')
    expect(input.get('area')).toBe('scope')
  })

  it('round-trips', () => {
    const f: Filters = { areas: ['labels'], lights: ['red'], scopes: null }
    expect(parseFilters(writeFilters(sp(''), f, FIVE), FIVE)).toEqual(f)
  })
})

describe('helpers', () => {
  it('hasActiveFilters', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...NO_FILTERS, scopes: ['IN_SCOPE'] })).toBe(true)
  })

  it('selectionFromControl ignores an empty selection and collapses a full one', () => {
    const all = ['red', 'yellow'] as const
    expect(selectionFromControl(['red'], [], all)).toEqual(['red'])
    expect(selectionFromControl(null, ['yellow'], all)).toEqual(['yellow'])
    expect(selectionFromControl(['red'], ['yellow', 'red'], all)).toBeNull()
  })
})

describe('search strings', () => {
  it('toSearch keeps commas literal and returns "" when empty', () => {
    expect(toSearch(sp('area=generic,scope&tab=claims'))).toBe('?area=generic,scope&tab=claims')
    expect(toSearch(sp(''))).toBe('')
  })
  it('withParam sets and removes one key, keeping the rest', () => {
    expect(withParam('?area=generic,scope', 'claim', 'F001-abc123')).toBe('?area=generic,scope&claim=F001-abc123')
    expect(withParam('?light=red&claim=F001-abc123', 'claim', null)).toBe('?light=red')
    expect(withParam('?claim=x', 'claim', null)).toBe('')
  })
  it('withParams sets and removes several keys', () => {
    expect(withParams('?tab=claims&focus=scope', { tab: null, focus: 'labels' })).toBe('?focus=labels')
  })
})
