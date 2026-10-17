import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { useOpenClaim } from '@/hooks/useOpenClaim'
import { adviceFor } from '@/i18n/advice'
import { useLocale, useT } from '@/i18n/context'
import { applyFilters, areaOf, claimLight } from '@/lib/areas'
import { withParam } from '@/lib/filters'
import { sourceLabel } from '@/lib/format'
import type { Claim, Filters } from '@/lib/types'
import { LightLabel } from './Light'

type Props = { claims: readonly Claim[]; filters: Filters; onClear: () => void }

// Below 700px each row stacks into a card; from 700px it's a normal table.
const CELL = 'block px-0 py-0.5 tab:table-cell tab:px-4 tab:py-3 tab:align-top'

/** `claims` arrive sorted (red first, then area order); filters apply here. */
export function ClaimTable({ claims, filters, onClear }: Props) {
  const t = useT()
  const { locale } = useLocale()
  const location = useLocation()
  const openClaim = useOpenClaim()
  const shown = useMemo(() => applyFilters(claims, filters), [claims, filters])

  return (
    <section aria-labelledby="claims-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="claims-heading" className="text-base font-medium">
          {t.claims.heading}
        </h2>
        <p className="text-sm text-muted-foreground" data-testid="claim-count">
          {t.claims.count(shown.length, claims.length)}
        </p>
      </div>

      {claims.length === 0 ? (
        <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">{t.claims.none}</p>
      ) : shown.length === 0 ? (
        <div className="space-y-3 rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t.claims.noMatch}</p>
          <Button variant="outline" size="sm" onClick={onClear}>
            {t.filters.clear}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <table className="block w-full text-sm tab:table">
            <thead className="hidden border-b text-xs tracking-wide text-muted-foreground uppercase tab:table-header-group">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t.claims.col.status}</th>
                <th className="px-4 py-3 text-left font-medium">{t.claims.col.excerpt}</th>
                <th className="px-4 py-3 text-left font-medium">{t.claims.col.reason}</th>
                <th className="px-4 py-3 text-left font-medium">{t.claims.col.source}</th>
              </tr>
            </thead>
            <tbody className="block divide-y tab:table-row-group">
              {shown.map((claim) => (
                <tr
                  key={claim.claim_id}
                  data-testid="claim-row"
                  data-claim-id={claim.claim_id}
                  data-light={claimLight(claim)}
                  onClick={() => openClaim(claim.claim_id)}
                  className="block cursor-pointer space-y-1 p-4 hover:bg-muted/50 tab:table-row tab:space-y-0 tab:p-0"
                >
                  <td className={`${CELL} whitespace-nowrap`}>
                    <LightLabel light={claimLight(claim)} />
                  </td>
                  <td className={`${CELL} tab:w-[38%]`}>
                    <Link
                      to={{ search: withParam(location.search, 'claim', claim.claim_id) }}
                      state={{ ...((location.state as object | null) ?? {}), drawerFromList: true }}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      <span lang="it">“{claim.text}”</span>
                    </Link>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{t.areas[areaOf(claim.category)].title}</span>
                  </td>
                  <td className={`${CELL} text-muted-foreground`}>{adviceFor(claim.category, locale).reason}</td>
                  <td className={`${CELL} tab:max-w-48`}>
                    <a
                      href={claim.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {sourceLabel(claim.source_url)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {claims.length > 0 && <p className="text-xs text-muted-foreground">{t.claims.footnote}</p>}
    </section>
  )
}
