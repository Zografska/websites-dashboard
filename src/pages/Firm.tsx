import { Link, useLocation, useParams } from 'react-router'
import { ClaimStrip } from '@/components/ClaimStrip'
import { FilterBar } from '@/components/FilterBar'
import { FirmHeader } from '@/components/FirmHeader'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFirmFilters } from '@/hooks/useFirmFilters'
import type { Firm as FirmData } from '@/lib/types'
import NotFound from './NotFound'

type FirmLocationState = { homeSearch?: string; drawerFromStrip?: boolean } | null

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
  const { data } = useData()
  const categories = data.categories
  const { filters, setFilters, clear } = useFirmFilters(categories)
  return (
    <div className="space-y-6">
      <Link to={`/${homeSearch}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← All firms
      </Link>
      <FirmHeader firm={firm} />
      <FilterBar categories={categories} filters={filters} onChange={setFilters} onClear={clear} />
      <ClaimStrip firm={firm} filters={filters} categories={categories} onClear={clear} />
    </div>
  )
}
