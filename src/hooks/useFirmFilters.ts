import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { NO_FILTERS, parseFilters, writeFilters } from '@/lib/filters'
import type { Filters } from '@/lib/types'

/** Filters live in the URL (`cat`, `conf`, `scope`); changes replace the history entry (D11). */
export function useFirmFilters(categories: string[]) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const search = params.toString()

  const filters = useMemo(() => parseFilters(new URLSearchParams(search), categories), [search, categories])

  const setFilters = useCallback(
    (next: Filters) => {
      // Commas are legal in a query string; keep shared links readable.
      const s = writeFilters(new URLSearchParams(search), next, categories).toString().replace(/%2C/gi, ',')
      // Keep location.state (homeSearch, drawerFromStrip) across filter changes.
      navigate({ search: s ? `?${s}` : '' }, { replace: true, state: location.state })
    },
    [search, categories, navigate, location.state],
  )

  const clear = useCallback(() => setFilters(NO_FILTERS), [setFilters])

  return { filters, setFilters, clear }
}
