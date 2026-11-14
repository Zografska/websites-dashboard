// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { claim, crawl, dataFile, firm } from '../src/lib/testData'
import { firmFile, parseArgs, parsePassphrases } from './encrypt-firms'

describe('encrypt-firms', () => {
  it('parses the passphrase CSV, with or without header', () => {
    expect([...parsePassphrases('firm_id,passphrase\nF1,a-b-c-d\nF2,e-f-g-h\n')]).toEqual([['F1', 'a-b-c-d'], ['F2', 'e-f-g-h']])
    expect(parsePassphrases('F1,x-y-z-w').get('F1')).toBe('x-y-z-w')
    expect(() => parsePassphrases('F1,a\nF1,b')).toThrow(/duplicate/)
  })
  it('a firm file holds only that firm', () => {
    const a = firm('F001', [crawl('F001', 1)], [claim('F001', 'aaaaaa', [1])])
    const b = firm('F002', [crawl('F002', 1)], [])
    const out = firmFile(dataFile([a, b]), a)
    expect(out.firms.map((f) => f.firm_id)).toEqual(['F001'])
    expect(JSON.stringify(out)).not.toContain('F002')
  })
  it('requires --in and --passphrases', () => {
    expect(() => parseArgs([])).toThrow()
    expect(parseArgs(['--in', 'a', '--passphrases', 'b']).concurrency).toBe(8)
  })
})
