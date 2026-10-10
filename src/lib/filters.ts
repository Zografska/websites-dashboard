import { CONFIDENCES, SCOPES, type Confidence, type Filters, type Scope } from './types'

export type { Filters }

export const NO_FILTERS: Filters = { categories: null, confidences: null, scopes: null }

/** Keeps known values in canonical order; empty or full selection → null. */
function normalizeSelection<T extends string>(values: readonly string[], all: readonly T[]): T[] | null {
  const wanted = new Set(values)
  const kept = all.filter((v) => wanted.has(v))
  return kept.length === 0 || kept.length === all.length ? null : kept
}

function parseParam<T extends string>(raw: string | null, all: readonly T[]): T[] | null {
  if (raw === null) return null
  return normalizeSelection(
    raw.split(',').map((s) => s.trim()),
    all,
  )
}

export function parseFilters(sp: URLSearchParams, allCategories: string[]): Filters {
  return {
    categories: parseParam(sp.get('cat'), allCategories),
    confidences: parseParam<Confidence>(sp.get('conf'), CONFIDENCES),
    scopes: parseParam<Scope>(sp.get('scope'), SCOPES),
  }
}

/** Returns a copy of `sp` with cat/conf/scope set canonically; all other params are kept. */
export function writeFilters(sp: URLSearchParams, f: Filters, allCategories: string[]): URLSearchParams {
  const out = new URLSearchParams(sp)
  const set = <T extends string>(key: string, sel: T[] | null, all: readonly T[]) => {
    const norm = sel === null ? null : normalizeSelection(sel, all)
    if (norm === null) out.delete(key)
    else out.set(key, norm.join(','))
  }
  set('cat', f.categories, allCategories)
  set('conf', f.confidences, CONFIDENCES)
  set('scope', f.scopes, SCOPES)
  return out
}

export function hasActiveFilters(f: Filters): boolean {
  return f.categories !== null || f.confidences !== null || f.scopes !== null
}

/**
 * Category toggle from a breakdown bar click (D15):
 * all → [X]; [X] → all; otherwise add or remove X; a full selection collapses to all.
 */
export function toggleCategory(current: string[] | null, id: string, all: readonly string[]): string[] | null {
  if (current === null) return normalizeSelection([id], all)
  if (current.includes(id)) {
    const rest = current.filter((c) => c !== id)
    return rest.length === 0 ? null : normalizeSelection(rest, all)
  }
  return normalizeSelection([...current, id], all)
}

/**
 * Sets a dimension from a multi-select control (ToggleGroup / checkbox menu).
 * An empty selection is ignored (returns `current` unchanged, §4.5); a full one becomes null.
 */
export function selectionFromControl<T extends string>(current: T[] | null, next: readonly string[], all: readonly T[]): T[] | null {
  const kept = all.filter((v) => next.includes(v))
  if (kept.length === 0) return current
  return kept.length === all.length ? null : kept
}

/** `?a=1&b=x,y` (or ""), keeping commas literal so shared links stay readable. */
export function toSearch(sp: URLSearchParams): string {
  const s = sp.toString().replace(/%2C/gi, ',')
  return s ? `?${s}` : ''
}

/** A copy of `search` with `key` set, or removed when `value` is null. */
export function withParam(search: string, key: string, value: string | null): string {
  const sp = new URLSearchParams(search)
  if (value === null) sp.delete(key)
  else sp.set(key, value)
  return toSearch(sp)
}
