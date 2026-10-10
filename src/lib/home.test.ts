import { describe, expect, it } from 'vitest'
import { clampPage, pageCount, pageList, searchFirms } from './home'
import { crawl, firm } from './testData'

const firms = ['F010', 'F002', 'F001', 'F100'].map((id, i) => ({
  ...firm(id, [crawl(id, 1)], []),
  firm_name: ['Verdeluce S.r.l.', 'Terranova S.p.A.', 'Aquaviva S.r.l.', 'Solemare S.r.l.s.'][i],
}))

describe('searchFirms', () => {
  it('sorts numerically by firm_id', () => {
    expect(searchFirms(firms, '').map((f) => f.firm_id)).toEqual(['F001', 'F002', 'F010', 'F100'])
  })
  it('matches id or name, case-insensitively', () => {
    expect(searchFirms(firms, 'f00').map((f) => f.firm_id)).toEqual(['F001', 'F002'])
    expect(searchFirms(firms, 'NOVA').map((f) => f.firm_id)).toEqual(['F002'])
    expect(searchFirms(firms, ' s.p.a ').map((f) => f.firm_id)).toEqual(['F002'])
    expect(searchFirms(firms, 'zzz')).toEqual([])
  })
})

describe('paging', () => {
  it('pageCount is at least 1', () => {
    expect(pageCount(0)).toBe(1)
    expect(pageCount(40)).toBe(3)
    expect(pageCount(45)).toBe(3)
  })
  it('clampPage handles invalid and out-of-range values', () => {
    expect(clampPage(null, 3)).toBe(1)
    expect(clampPage('abc', 3)).toBe(1)
    expect(clampPage('-2', 3)).toBe(1)
    expect(clampPage('0', 3)).toBe(1)
    expect(clampPage('2.5', 3)).toBe(1)
    expect(clampPage('2', 3)).toBe(2)
    expect(clampPage('99', 3)).toBe(3)
  })
  it('pageList shows every page up to 7', () => {
    expect(pageList(1, 3)).toEqual([1, 2, 3])
    expect(pageList(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('pageList adds ellipses above 7 pages', () => {
    expect(pageList(1, 10)).toEqual([1, 2, 3, 4, 'ellipsis', 10])
    expect(pageList(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
    expect(pageList(10, 10)).toEqual([1, 'ellipsis', 7, 8, 9, 10])
    expect(pageList(3, 10)).toEqual([1, 2, 3, 4, 'ellipsis', 10])
  })
})
