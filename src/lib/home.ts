import { reviewSummary } from './areas'
import type { Firm } from './types'

export const PAGE_SIZE = 15

/** Most red areas first, then most yellow areas; firms without a successful crawl last. */
function reviewKey(firm: Firm): [number, number] {
  const s = reviewSummary(firm)
  return s === null ? [-1, -1] : [s.red, s.yellow]
}

/** Case-insensitive substring match on firm_id or firm_name, sorted by review need, then firm_id (numeric-aware). */
export function searchFirms(firms: readonly Firm[], q: string): Firm[] {
  const needle = q.trim().toLowerCase()
  const keys = new Map(firms.map((f) => [f.firm_id, reviewKey(f)]))
  return firms
    .filter((f) => needle === '' || f.firm_id.toLowerCase().includes(needle) || f.firm_name.toLowerCase().includes(needle))
    .sort((a, b) => {
      const [ra, ya] = keys.get(a.firm_id)!
      const [rb, yb] = keys.get(b.firm_id)!
      return rb - ra || yb - ya || a.firm_id.localeCompare(b.firm_id, undefined, { numeric: true })
    })
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}

/** Parses `page` from the URL and clamps it to [1, count]; anything invalid means 1. */
export function clampPage(raw: string | null, count: number): number {
  if (raw === null || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  return n < 1 ? 1 : Math.min(n, count)
}

/** Page numbers to show, with 'ellipsis' gaps once there are more than 7 pages. */
export function pageList(current: number, count: number): (number | 'ellipsis')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('ellipsis')
    out.push(p)
  })
  return out
}
