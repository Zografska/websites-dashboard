// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { MESSAGES } from './messages'

// One sample argument that works as a number, a string and a confidence-counts object.
const ARG = Object.assign(new String('X'), { high: 2, medium: 3, low: 4 })

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
    expect(same).toEqual(['M'])
  })

  it('confidence is never labelled as risk or severity', () => {
    for (const m of Object.values(MESSAGES)) {
      const { tooltip, ...labels } = m.confidence
      expect(strings(labels).join(' ')).not.toMatch(/risk|severity|rischio|gravit/i)
      expect(tooltip).toMatch(/not legal severity|non gravità legale/)
    }
  })
})
