import { Link } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Not found')
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-muted-foreground">That page or firm doesn&apos;t exist.</p>
      <Link to="/" className="underline underline-offset-4">
        Back to all firms
      </Link>
    </div>
  )
}
