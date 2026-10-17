// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ADVICE } from './advice'
import { MESSAGES } from './messages'

// One sample argument that works as a number and a string.
const ARG = new String('X')

/** Every string in the dictionary, with functions called on the sample argument. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value === 'function') return [String((value as (...a: unknown[]) => unknown)(ARG, ARG, ARG))]
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

describe('messages', () => {
  it('Italian is a full translation, not English left in place', () => {
    const en = strings(MESSAGES.en)
    const it = strings(MESSAGES.it)
    expect(it).toHaveLength(en.length)
    // Identical entries are only allowed where the word is the same in both languages.
    const same = en.filter((s, i) => s === it[i])
    expect(same).toEqual(['Area'])
  })

  it('confidence is never labelled as risk or severity', () => {
    for (const m of Object.values(MESSAGES)) {
      const { tooltip, ...labels } = m.confidence
      expect(strings(labels).join(' ')).not.toMatch(/risk|severity|rischio|gravit/i)
      expect(tooltip).toMatch(/not legal severity|non gravità legale/)
    }
  })

  it('advice covers the same categories in both languages, fully translated', () => {
    expect(Object.keys(ADVICE.it).sort()).toEqual(Object.keys(ADVICE.en).sort())
    const en = strings(ADVICE.en)
    const it = strings(ADVICE.it)
    expect(it).toHaveLength(en.length)
    expect(en.filter((s, i) => s === it[i])).toEqual([])
  })

  it('every area has text in both languages', () => {
    for (const m of Object.values(MESSAGES)) {
      for (const a of Object.values(m.areas)) expect(a.title && a.subtitle && a.guidance).toBeTruthy()
    }
  })
})
