import { beforeEach, describe, expect, it } from 'vitest'
import { CONSENT_KEY, getConsent, isCurrent, parseConsent, POLICY_V, resetConsentCache, storeConsent } from './consent'

const NOW = new Date('2026-11-14T12:00:00Z')
const stored = (over: object = {}) => JSON.stringify({ choice: 'granted', policy_v: POLICY_V, at: '2026-11-01T00:00:00Z', ...over })

beforeEach(() => {
  localStorage.clear()
  resetConsentCache()
})

describe('consent storage', () => {
  it('reads a current choice', () => {
    expect(parseConsent(stored(), NOW)?.choice).toBe('granted')
    expect(parseConsent(stored({ choice: 'denied' }), NOW)?.choice).toBe('denied')
  })

  it('asks again after 6 months', () => {
    const c = { choice: 'granted' as const, policy_v: POLICY_V, at: '2026-05-14T12:00:01Z' }
    expect(isCurrent(c, NOW)).toBe(true)
    expect(isCurrent({ ...c, at: '2026-05-14T11:59:59Z' }, NOW)).toBe(false)
  })

  it('asks again when the policy version is older', () => {
    expect(parseConsent(stored({ policy_v: POLICY_V - 1 }), NOW)).toBeNull()
  })

  it('treats anything malformed as no choice', () => {
    for (const raw of [null, '', 'granted', '{}', '{"choice":"yes","policy_v":1,"at":"2026-11-01"}', stored({ at: 'not a date' }), stored({ unreported: 'x' })]) {
      expect(parseConsent(raw, NOW)).toBeNull()
    }
  })

  it('writes the documented shape', () => {
    storeConsent('denied', undefined, NOW)
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toEqual({ choice: 'denied', policy_v: POLICY_V, at: NOW.toISOString() })
    expect(getConsent()).toBe('denied')
  })

  it('keeps the choice in memory when storage throws', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
    try {
      storeConsent('granted')
      expect(getConsent()).toBe('granted')
    } finally {
      Storage.prototype.setItem = original
    }
    resetConsentCache() // next visit
    expect(getConsent()).toBeNull()
  })
})
