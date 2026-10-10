import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { NO_FILTERS, parseFilters, toSearch, writeFilters } from '@/lib/filters'
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
      // Keep location.state (homeSearch, drawerFromStrip) across filter changes.
      navigate({ search: toSearch(writeFilters(new URLSearchParams(search), next, categories)) }, { replace: true, state: location.state })
    },
    [search, categories, navigate, location.state],
  )

  const clear = useCallback(() => setFilters(NO_FILTERS), [setFilters])

  return { filters, setFilters, clear }
}
