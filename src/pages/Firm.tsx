import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ClaimDrawer } from '@/components/ClaimDrawer'
import { ClaimTable } from '@/components/ClaimTable'
import { FilterBar } from '@/components/FilterBar'
import { FirmHeader } from '@/components/FirmHeader'
import { HowToRead } from '@/components/HowToRead'
import { OverviewTab } from '@/components/OverviewTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFirmFilters } from '@/hooks/useFirmFilters'
import { useT } from '@/i18n/context'
import { areaSummaries, defaultFocus, reviewSummary, sortClaims } from '@/lib/areas'
import { presentClaims } from '@/lib/derive'
import { NO_FILTERS, toSearch, withParams, writeFilters } from '@/lib/filters'
import type { Area, Firm as FirmData } from '@/lib/types'
import NotFound from './NotFound'

type FirmLocationState = { homeSearch?: string; drawerFromList?: boolean } | null

const TABS = ['overview', 'claims', 'how'] as const
type Tab = (typeof TABS)[number]

export default function Firm() {
  const { firmId = '' } = useParams()
  const { firmsById } = useData()
  const location = useLocation()
  const firm = firmsById.get(firmId)
  if (!firm) return <NotFound />
  return <FirmView key={firm.firm_id} firm={firm} homeSearch={(location.state as FirmLocationState)?.homeSearch ?? ''} />
}

function FirmView({ firm, homeSearch }: { firm: FirmData; homeSearch: string }) {
  useDocumentTitle(firm.firm_id)
  const t = useT()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const summaries = useMemo(() => areaSummaries(firm), [firm])
  const review = useMemo(() => reviewSummary(firm, summaries), [firm, summaries])
  const claims = useMemo(() => sortClaims(presentClaims(firm)), [firm])
  const areas = useMemo(() => summaries.map((s) => s.area), [summaries])
  const { filters, setFilters, clear } = useFirmFilters(areas)

  const rawTab = params.get('tab')
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'overview'
  const rawFocus = params.get('focus') as Area | null
  const focus = rawFocus !== null && areas.includes(rawFocus) ? rawFocus : defaultFocus(summaries)

  // Tab and focus changes replace the history entry, like filters (D11).
  const go = (values: Record<string, string | null>) => navigate({ search: withParams(location.search, values) }, { replace: true, state: location.state })
  const setTab = (next: string) => go({ tab: next === 'overview' ? null : next })
  const seeAll = (area: Area) => {
    const sp = writeFilters(new URLSearchParams(location.search), { ...NO_FILTERS, areas: [area] }, areas)
    sp.set('tab', 'claims')
    navigate({ search: toSearch(sp) }, { replace: true, state: location.state })
  }

  return (
    <div className="space-y-4">
      <Link to={`/${homeSearch}`} className="text-sm text-muted-foreground hover:text-foreground">
        {t.firm.allFirms}
      </Link>
      <div>
        <FirmHeader firm={firm} />
        <div className="rounded-b-xl border p-4 tab:p-6">
          {review === null ? (
            <p className="text-sm text-muted-foreground">{t.firm.noCrawl}</p>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="gap-6">
              <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b pb-1">
                {TABS.map((id) => (
                  <TabsTrigger key={id} value={id} className="flex-none px-2 text-sm tab:px-3 tab:text-base">
                    {t.firm.tabs[id]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="overview">
                <OverviewTab summaries={summaries} review={review} focus={focus} onFocus={(a) => go({ focus: a })} onSeeAll={seeAll} />
              </TabsContent>
              <TabsContent value="claims" className="space-y-4">
                {claims.length > 0 && <FilterBar areas={areas} filters={filters} onChange={setFilters} onClear={clear} />}
                <ClaimTable claims={claims} filters={filters} onClear={clear} />
              </TabsContent>
              <TabsContent value="how">
                <HowToRead firm={firm} futureFound={summaries.some((s) => s.area === 'future' && s.claims.length > 0)} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <ClaimDrawer firm={firm} />
    </div>
  )
}
