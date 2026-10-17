import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { DataErrorScreen } from '@/components/DataErrorScreen'
import { LanguageToggle } from '@/components/LanguageToggle'
import { PasscodeGate } from '@/components/PasscodeGate'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDataState, type DataState } from '@/data/context'
import { useT } from '@/i18n/context'

const FILE_ERROR = { 'not-found': 'notFound', 'invalid-file': 'invalidFile' } as const
const DATA_ERROR = { 'invalid-json': 'invalidJson', validation: 'validation' } as const

function Body({ state, unlock, children }: { state: DataState; unlock: (p: string) => void; children: ReactNode }) {
  const t = useT()
  switch (state.status) {
    case 'loading-file':
      return <Loading />
    case 'unlocking':
      return state.silent ? <Loading /> : <PasscodeGate busy onUnlock={unlock} />
    case 'locked':
      return <PasscodeGate busy={false} error={state.error && t.gate.wrongPasscode} onUnlock={unlock} />
    case 'file-error':
      return <DataErrorScreen title={t.errors.fileTitle} message={t.errors[FILE_ERROR[state.reason]]} />
    case 'data-error':
      return <DataErrorScreen title={t.errors.dataTitle} message={t.errors[DATA_ERROR[state.reason]]} issues={state.issues} />
    case 'ready':
      return children
  }
}

function Loading() {
  const t = useT()
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-label={t.loading}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, unlock, lock } = useDataState()
  const t = useT()
  return (
    <div className="flex min-h-svh flex-col" data-app-state={state.status}>
      <header className="border-b">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link to="/" className="font-semibold tracking-tight">
            {t.appTitle}
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/methodology" className="text-muted-foreground hover:text-foreground">
              {t.nav.methodology}
            </Link>
            {state.status === 'ready' && (
              <Button variant="outline" size="sm" onClick={lock}>
                {t.nav.lock}
              </Button>
            )}
            <LanguageToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Body state={state} unlock={(p) => void unlock(p)}>
          {children}
        </Body>
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">{t.disclaimer}</p>
      </footer>
    </div>
  )
}
