import { FirmTable } from '@/components/FirmTable'
import { useData } from '@/data/context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/i18n/context'

export default function Home() {
  useDocumentTitle()
  const { data } = useData()
  const t = useT()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t.home.title}</h1>
      <FirmTable firms={data.firms} />
    </div>
  )
}
