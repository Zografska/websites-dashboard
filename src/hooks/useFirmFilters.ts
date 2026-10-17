import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { NO_FILTERS, parseFilters, toSearch, writeFilters } from '@/lib/filters'
import type { Area, Filters } from '@/lib/types'

/** Filters live in the URL (`area`, `light`, `scope`); changes replace the history entry (D11). */
export function useFirmFilters(areas: readonly Area[]) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const search = params.toString()

  const filters = useMemo(() => parseFilters(new URLSearchParams(search), areas), [search, areas])

  const setFilters = useCallback(
    (next: Filters) => {
      // Keep location.state (homeSearch, drawerFromList) across filter changes.
      navigate({ search: toSearch(writeFilters(new URLSearchParams(search), next, areas)) }, { replace: true, state: location.state })
    },
    [search, areas, navigate, location.state],
  )

  const clear = useCallback(() => setFilters(NO_FILTERS), [setFilters])

  return { filters, setFilters, clear }
}
