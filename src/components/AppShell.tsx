import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { DataErrorScreen } from '@/components/DataErrorScreen'
import { PasscodeGate } from '@/components/PasscodeGate'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDataState, type DataState } from '@/data/context'

export const DISCLAIMER = 'Research prototype. Automated detection, not a legal assessment.'

function Body({ state, unlock, children }: { state: DataState; unlock: (p: string) => void; children: ReactNode }) {
  switch (state.status) {
    case 'loading-file':
      return <Loading />
    case 'unlocking':
      return state.silent ? <Loading /> : <PasscodeGate busy onUnlock={unlock} />
    case 'locked':
      return <PasscodeGate busy={false} error={state.error} onUnlock={unlock} />
    case 'file-error':
      return <DataErrorScreen title="Couldn't load the data" message={state.message} />
    case 'data-error':
      return <DataErrorScreen title="The data can't be displayed" message={state.message} issues={state.issues} />
    case 'ready':
      return children
  }
}

function Loading() {
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, unlock, lock } = useDataState()
  return (
    <div className="flex min-h-svh flex-col" data-app-state={state.status}>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Firm Claims Dashboard
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/methodology" className="text-muted-foreground hover:text-foreground">
              Methodology
            </Link>
            {state.status === 'ready' && (
              <Button variant="outline" size="sm" onClick={lock}>
                Lock
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Body state={state} unlock={(p) => void unlock(p)}>
          {children}
        </Body>
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">{DISCLAIMER}</p>
      </footer>
    </div>
  )
}
