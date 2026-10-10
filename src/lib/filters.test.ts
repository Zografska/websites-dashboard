import { describe, expect, it } from 'vitest'
import { hasActiveFilters, NO_FILTERS, parseFilters, selectionFromControl, writeFilters } from './filters'
import { CATS } from './testData'
import type { Filters } from './types'

const sp = (s: string) => new URLSearchParams(s)

describe('parseFilters', () => {
  it('reads all three params', () => {
    expect(parseFilters(sp('cat=certification,generic_green&conf=high&scope=IN_SCOPE'), CATS)).toEqual({
      categories: ['generic_green', 'certification'],
      confidences: ['high'],
      scopes: ['IN_SCOPE'],
    })
  })

  it('drops unknown values and duplicates, trims', () => {
    expect(parseFilters(sp('cat= certification ,nope,certification&conf=severe,low,low'), CATS)).toEqual({
      categories: ['certification'],
      confidences: ['low'],
      scopes: null,
    })
  })

  it('maps missing, empty, all-unknown and full selections to null', () => {
    expect(parseFilters(sp(''), CATS)).toEqual(NO_FILTERS)
    expect(parseFilters(sp('cat=&conf=nope'), CATS)).toEqual(NO_FILTERS)
    expect(parseFilters(sp('conf=low,high,medium&scope=NEEDS_VERIFICATION,IN_SCOPE'), CATS)).toEqual(NO_FILTERS)
  })
})

describe('writeFilters', () => {
  it('writes canonical order and keeps other params', () => {
    const f: Filters = { categories: ['recycled_recyclable', 'generic_green'], confidences: ['low', 'high'], scopes: ['NEEDS_VERIFICATION'] }
    const out = writeFilters(sp('claim=F001-abcdef&x=1'), f, CATS)
    expect(out.get('cat')).toBe('generic_green,recycled_recyclable')
    expect(out.get('conf')).toBe('high,low')
    expect(out.get('scope')).toBe('NEEDS_VERIFICATION')
    expect(out.get('claim')).toBe('F001-abcdef')
    expect(out.get('x')).toBe('1')
  })

  it('removes params for null and full sets, and returns a copy', () => {
    const input = sp('cat=certification&conf=high&claim=F001-abcdef')
    const out = writeFilters(input, { categories: [...CATS], confidences: null, scopes: ['IN_SCOPE', 'NEEDS_VERIFICATION'] }, CATS)
    expect(out.toString()).toBe('claim=F001-abcdef')
    expect(input.get('cat')).toBe('certification')
  })

  it('round-trips', () => {
    const f: Filters = { categories: ['certification'], confidences: ['medium', 'low'], scopes: null }
    expect(parseFilters(writeFilters(sp(''), f, CATS), CATS)).toEqual(f)
  })
})

describe('helpers', () => {
  it('hasActiveFilters', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...NO_FILTERS, scopes: ['IN_SCOPE'] })).toBe(true)
  })

  it('selectionFromControl ignores an empty selection and collapses a full one', () => {
    const all = ['high', 'medium', 'low'] as const
    expect(selectionFromControl(['high'], [], all)).toEqual(['high'])
    expect(selectionFromControl(null, ['low', 'high'], all)).toEqual(['high', 'low'])
    expect(selectionFromControl(['high'], ['high', 'medium', 'low'], all)).toBeNull()
  })
})
