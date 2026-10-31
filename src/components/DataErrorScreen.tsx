import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/context'
import type { DataIssue } from '@/lib/schema'

const MAX_ISSUES = 50

type Props = { title: string; message: string; issues?: DataIssue[] }

export function DataErrorScreen({ title, message, issues = [] }: Props) {
  const t = useT()
  const shown = issues.slice(0, MAX_ISSUES)
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-6" data-testid="data-error">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {shown.length > 0 && (
        <div className="max-h-80 overflow-y-auto rounded-md border p-3">
          <ul className="space-y-1 font-mono text-xs">
            {shown.map((issue, i) => (
              <li key={i} className="break-words">
                {issue.path}: {issue.message}
              </li>
            ))}
          </ul>
          {issues.length > MAX_ISSUES && <p className="mt-2 text-xs text-muted-foreground">{t.errors.more(issues.length - MAX_ISSUES)}</p>}
        </div>
      )}
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t.errors.tryAgain}
      </Button>
    </div>
  )
}
