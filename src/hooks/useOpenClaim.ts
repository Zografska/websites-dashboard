import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { withParam } from '@/lib/filters'

/** Opening the drawer pushes a history entry, so Back closes it (D11). */
export function useOpenClaim() {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(
    (claimId: string) =>
      navigate(
        { search: withParam(location.search, 'claim', claimId) },
        { state: { ...((location.state as object | null) ?? {}), drawerFromList: true } },
      ),
    [navigate, location.search, location.state],
  )
}
