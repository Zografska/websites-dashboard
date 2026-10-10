import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Home() {
  useDocumentTitle()
  return <h1 className="text-2xl font-semibold">Firms</h1>
}
