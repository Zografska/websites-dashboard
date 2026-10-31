import type { Locale } from '@/i18n/messages'
import type { Claim, CrawlStatus } from './types'

const MONTHS: Record<Locale, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
}

const STATUS: Record<Locale, Record<Exclude<CrawlStatus, 'ok'>, string>> = {
  en: { failed: 'failed', partial: 'partial' },
  it: { failed: 'non riuscita', partial: 'parziale' },
}

/** `12 Oct 2026` / `12 ott 2026`, always UTC, never Intl (newer ICU writes "Sept"). */
export function formatDate(iso: string, locale: Locale = 'en'): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** `2 Nov 2026`, plus ` (failed)` / ` (partial)` when the status isn't ok. */
export function formatDateWithStatus(iso: string, status: CrawlStatus, locale: Locale = 'en'): string {
  return status === 'ok' ? formatDate(iso, locale) : `${formatDate(iso, locale)} (${STATUS[locale][status]})`
}

export function hostname(url: string): string {
  return new URL(url).host.replace(/^www\./, '')
}

/** A short page label for the Source column: the path, or the host for the home page. */
export function sourceLabel(url: string): string {
  const u = new URL(url)
  const path = u.pathname.replace(/\/+$/, '')
  return path === '' ? hostname(url) : decodeURIComponent(path)
}

/** The URL without its protocol, for display. */
export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

export function legalRefLabel(ref: Claim['legal_ref'], locale: Locale = 'en'): string {
  if (ref.ucpd === null && ref.codice_consumo === null) return locale === 'it' ? 'Non ancora associato' : 'Not yet mapped'
  return `UCPD ${ref.ucpd ?? '—'} / Cod. Cons. ${ref.codice_consumo ?? '—'}`
}
