import { useParams } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Firm() {
  const { firmId } = useParams()
  useDocumentTitle(firmId)
  return <h1 className="font-mono text-2xl font-semibold">{firmId}</h1>
}
