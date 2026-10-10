import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { applyFilters, getLatestCrawl, isPresent, lastSeen, sortForStrip, stripCounts } from '@/lib/derive'
import { withParam } from '@/lib/filters'
import type { Filters, Firm } from '@/lib/types'
import { ClaimCard } from './ClaimCard'

type Props = { firm: Firm; filters: Filters; categories: readonly string[]; onClear: () => void }

export function ClaimStrip({ firm, filters, categories, onClear }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const latest = getLatestCrawl(firm)
  const claims = useMemo(() => sortForStrip(applyFilters(firm.claims, filters), firm), [firm, filters])
  const counts = stripCounts(claims, firm)

  // Opening the drawer pushes a history entry, so Back closes it (D11).
  const open = (claimId: string) =>
    navigate(
      { search: withParam(location.search, 'claim', claimId) },
      { state: { ...((location.state as object | null) ?? {}), drawerFromStrip: true } },
    )

  return (
    <section aria-labelledby="claims-heading" className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="claims-heading" className="text-lg font-semibold">
          Claims
        </h2>
        <p className="text-sm text-muted-foreground" data-testid="strip-count">
          {counts.total} {counts.total === 1 ? 'claim' : 'claims'} ({counts.present} present, {counts.removed} removed)
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Dashed border = needs verification · Greyed = no longer found</p>

      {firm.claims.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No claims detected on this site yet.</p>
      ) : claims.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No claims match these filters.
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-md" data-testid="claim-strip">
          <div className="flex gap-3 pb-3">
            {claims.map((c) => (
              <ClaimCard
                key={c.claim_id}
                claim={c}
                categories={categories}
                present={isPresent(c, latest)}
                lastSeen={lastSeen(c, firm)}
                onOpen={open}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  )
}
