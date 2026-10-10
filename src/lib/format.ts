import type { Claim, Confidence, CrawlStatus, Scope } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `12 Oct 2026`, always UTC, never Intl (newer ICU writes "Sept"). */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** `2 Nov 2026`, plus ` (failed)` / ` (partial)` when the status isn't ok. */
export function formatDateWithStatus(iso: string, status: CrawlStatus): string {
  return status === 'ok' ? formatDate(iso) : `${formatDate(iso)} (${status})`
}

export function hostname(url: string): string {
  return new URL(url).host.replace(/^www\./, '')
}

/** The URL without its protocol, for display. */
export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

export function legalRefLabel(ref: Claim['legal_ref']): string {
  if (ref.ucpd === null && ref.codice_consumo === null) return 'Not yet mapped'
  return `UCPD ${ref.ucpd ?? '—'} / Cod. Cons. ${ref.codice_consumo ?? '—'}`
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = { high: 'High', medium: 'Medium', low: 'Low' }
export const CONFIDENCE_TOOLTIP = 'Detector confidence, not legal severity'
export const SCOPE_LABEL: Record<Scope, string> = { IN_SCOPE: 'In scope', NEEDS_VERIFICATION: 'Needs verification' }
