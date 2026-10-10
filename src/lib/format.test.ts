// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { categoryColorVar, categoryLabel } from './categories'
import { formatDate, formatDateWithStatus, hostname, legalRefLabel, stripProtocol } from './format'
import { cleanMethodology } from './methodology'

describe('formatDate', () => {
  it('uses the fixed month table (Sep, not Sept)', () => {
    expect(formatDate('2026-09-27T10:00:00Z')).toBe('27 Sep 2026')
    expect(formatDate('2026-10-12T09:10:00Z')).toBe('12 Oct 2026')
  })
  it('is UTC near midnight', () => {
    expect(formatDate('2026-10-31T23:59:00Z')).toBe('31 Oct 2026')
    expect(formatDate('2026-11-01T00:30:00+02:00')).toBe('31 Oct 2026')
  })
  it('appends non-ok status', () => {
    expect(formatDateWithStatus('2026-11-02T09:00:00Z', 'failed')).toBe('2 Nov 2026 (failed)')
    expect(formatDateWithStatus('2026-11-02T09:00:00Z', 'ok')).toBe('2 Nov 2026')
  })
})

describe('urls', () => {
  it('hostname drops www.', () => {
    expect(hostname('https://www.verdeluce.example/chi-siamo')).toBe('verdeluce.example')
    expect(hostname('http://shop.verdeluce.example')).toBe('shop.verdeluce.example')
  })
  it('stripProtocol', () => {
    expect(stripProtocol('https://www.verdeluce.example/ambiente')).toBe('www.verdeluce.example/ambiente')
  })
})

describe('legalRefLabel', () => {
  it('both values', () => expect(legalRefLabel({ ucpd: 'Annex I 4a', codice_consumo: 'Art. 23' })).toBe('UCPD Annex I 4a / Cod. Cons. Art. 23'))
  it('one null', () => expect(legalRefLabel({ ucpd: 'Art. 7', codice_consumo: null })).toBe('UCPD Art. 7 / Cod. Cons. —'))
  it('both null', () => expect(legalRefLabel({ ucpd: null, codice_consumo: null })).toBe('Not yet mapped'))
})

describe('categories', () => {
  it('labels known and unknown ids', () => {
    expect(categoryLabel('recycled_recyclable')).toBe('Recycled / recyclable')
    expect(categoryLabel('environmental_comparison')).toBe('Environmental comparison')
    expect(categoryLabel('toString')).toBe('ToString')
  })
  it('assigns colors by index with a fallback', () => {
    const cats = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    expect(categoryColorVar('a', cats)).toBe('var(--cat-1)')
    expect(categoryColorVar('g', cats)).toBe('var(--cat-7)')
    expect(categoryColorVar('h', cats)).toBe('var(--cat-fallback)')
    expect(categoryColorVar('zzz', cats)).toBe('var(--cat-fallback)')
  })
})

describe('cleanMethodology (real METHODOLOGY.md)', () => {
  const md = readFileSync(path.resolve(import.meta.dirname, '../content/METHODOLOGY.md'), 'utf8')
  const out = cleanMethodology(md)
  it('strips TODO comments', () => {
    expect(out).not.toContain('TODO')
    expect(out).not.toContain('<!--')
  })
  it('drops bullets left as only a label', () => {
    expect(out).not.toMatch(/\*\*Firms:\*\*/)
    expect(out).not.toMatch(/\*\*Scraping:\*\*/)
    expect(out).toMatch(/\*\*Cadence:\*\*/)
  })
  it('keeps the tables', () => {
    expect(out).toContain('| UCPD (EU) | Codice del Consumo (IT) | content |')
    expect(out).toContain('| `generic_green` |')
  })
})
