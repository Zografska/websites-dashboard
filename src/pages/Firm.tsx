import { Link, useLocation, useParams } from 'react-router'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import NotFound from './NotFound'

type FirmLocationState = { homeSearch?: string; drawerFromStrip?: boolean } | null

export default function Firm() {
  const { firmId = '' } = useParams()
  const { firmsById } = useData()
  const location = useLocation()
  const firm = firmsById.get(firmId)
  if (!firm) return <NotFound />
  return <FirmView key={firm.firm_id} firmId={firm.firm_id} homeSearch={(location.state as FirmLocationState)?.homeSearch ?? ''} />
}

function FirmView({ firmId, homeSearch }: { firmId: string; homeSearch: string }) {
  useDocumentTitle(firmId)
  return (
    <div className="space-y-6">
      <Link to={`/${homeSearch}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← All firms
      </Link>
      <h1 className="font-mono text-2xl font-semibold">{firmId}</h1>
    </div>
  )
}
