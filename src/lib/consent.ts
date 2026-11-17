// The visitor's choice about the optional engagement measurement (ANALYTICS_SPEC §5.2).
// Storing the choice is strictly necessary, so it needs no consent itself.
import { useSyncExternalStore } from 'react'

/** Bump on a material change to the privacy notice: everyone is asked again. */
export const POLICY_V = 2
/** Date of the current notice version, shown at the top of the privacy page. */
export const POLICY_DATE = '2026-11-17'
export const CONSENT_KEY = 'fcd.consent'
/** The choice is asked again after 6 months (A13). */
export const CONSENT_MONTHS = 6

export type ConsentChoice = 'granted' | 'denied'
export type ConsentWhere = 'banner' | 'privacy_page'

export type StoredConsent = {
  choice: ConsentChoice
  policy_v: number
  at: string
  /** Set while `consent_granted` hasn't been sent yet (accepted before unlock); removed once it is. */
  unreported?: ConsentWhere
}

function isStored(v: unknown): v is StoredConsent {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    (o.choice === 'granted' || o.choice === 'denied') &&
    typeof o.policy_v === 'number' &&
    typeof o.at === 'string' &&
    !Number.isNaN(Date.parse(o.at)) &&
    (o.unreported === undefined || o.unreported === 'banner' || o.unreported === 'privacy_page')
  )
}

/** A stored choice counts while its policy version is current and it is under 6 months old. */
export function isCurrent(c: StoredConsent, now: Date): boolean {
  if (c.policy_v < POLICY_V) return false
  const expires = new Date(c.at)
  expires.setUTCMonth(expires.getUTCMonth() + CONSENT_MONTHS)
  return now.getTime() < expires.getTime()
}

/** Parses a raw storage value. Anything malformed, outdated or expired is "no choice yet". */
export function parseConsent(raw: string | null, now: Date): StoredConsent | null {
  if (raw === null) return null
  try {
    const v: unknown = JSON.parse(raw)
    return isStored(v) && isCurrent(v, now) ? v : null
  } catch {
    return null
  }
}

// `undefined` = not read yet. If storage throws, the choice lives in memory for this page load
// only, so the banner comes back on the next visit.
let current: StoredConsent | null | undefined
const listeners = new Set<() => void>()

function load(): StoredConsent | null {
  if (current === undefined) {
    try {
      current = parseConsent(localStorage.getItem(CONSENT_KEY), new Date())
    } catch {
      current = null
    }
  }
  return current
}

function save(next: StoredConsent) {
  current = next
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next))
  } catch {
    /* memory only */
  }
  listeners.forEach((l) => l())
}

export function getStoredConsent(): StoredConsent | null {
  return load()
}

export function getConsent(): ConsentChoice | null {
  return load()?.choice ?? null
}

export function storeConsent(choice: ConsentChoice, unreported?: ConsentWhere, now = new Date()) {
  save({ choice, policy_v: POLICY_V, at: now.toISOString(), ...(unreported ? { unreported } : {}) })
}

/** `consent_granted` has been sent: drop the marker, keep the choice and its date. */
export function markConsentReported() {
  const c = load()
  if (!c?.unreported) return
  save({ choice: c.choice, policy_v: c.policy_v, at: c.at })
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current choice, or `null` while the banner still has to be answered. */
export function useConsent(): ConsentChoice | null {
  return useSyncExternalStore(subscribeConsent, getConsent, () => null)
}

/** Tests only: forget the cached value so the next read hits storage again. */
export function resetConsentCache() {
  current = undefined
}
