import { Link, useLocation, useParams } from 'react-router'
import { FirmHeader } from '@/components/FirmHeader'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
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
  return (
    <div className="space-y-6">
      <Link to={`/${homeSearch}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← All firms
      </Link>
      <FirmHeader firm={firm} />
    </div>
  )
}
