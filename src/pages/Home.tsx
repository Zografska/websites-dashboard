import { FirmTable } from '@/components/FirmTable'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Home() {
  useDocumentTitle()
  const { data } = useData()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Firms</h1>
      <FirmTable firms={data.firms} />
    </div>
  )
}
