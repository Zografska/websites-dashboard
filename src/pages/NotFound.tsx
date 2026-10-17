import { Link } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/i18n/context'

export default function NotFound() {
  const t = useT()
  useDocumentTitle(t.notFound.title)
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
      <p className="text-muted-foreground">{t.notFound.body}</p>
      <Link to="/" className="underline underline-offset-4">
        {t.notFound.back}
      </Link>
    </div>
  )
}
