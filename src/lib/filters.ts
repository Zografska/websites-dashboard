import { LIGHTS, SCOPES, type Area, type Filters, type Light, type Scope } from './types'

export type { Filters }

export const NO_FILTERS: Filters = { areas: null, lights: null, scopes: null }

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

/** `allAreas` is the firm's area list (the five, plus `other` when it has claims). */
export function parseFilters(sp: URLSearchParams, allAreas: readonly Area[]): Filters {
  return {
    areas: parseParam(sp.get('area'), allAreas),
    lights: parseParam<Light>(sp.get('light'), LIGHTS),
    scopes: parseParam<Scope>(sp.get('scope'), SCOPES),
  }
}

/** Returns a copy of `sp` with area/light/scope set canonically; all other params are kept. */
export function writeFilters(sp: URLSearchParams, f: Filters, allAreas: readonly Area[]): URLSearchParams {
  const out = new URLSearchParams(sp)
  const set = <T extends string>(key: string, sel: T[] | null, all: readonly T[]) => {
    const norm = sel === null ? null : normalizeSelection(sel, all)
    if (norm === null) out.delete(key)
    else out.set(key, norm.join(','))
  }
  set('area', f.areas, allAreas)
  set('light', f.lights, LIGHTS)
  set('scope', f.scopes, SCOPES)
  return out
}

export function hasActiveFilters(f: Filters): boolean {
  return f.areas !== null || f.lights !== null || f.scopes !== null
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

/** A copy of `search` with several keys set or removed at once. */
export function withParams(search: string, values: Record<string, string | null>): string {
  const sp = new URLSearchParams(search)
  for (const [key, value] of Object.entries(values)) {
    if (value === null) sp.delete(key)
    else sp.set(key, value)
  }
  return toSearch(sp)
}
