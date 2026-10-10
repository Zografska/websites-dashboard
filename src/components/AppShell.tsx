import type { ReactNode } from 'react'
import { Link } from 'react-router'

export const DISCLAIMER = 'Research prototype. Automated detection, not a legal assessment.'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Firm Claims Dashboard
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link to="/methodology" className="text-muted-foreground hover:text-foreground">
              Methodology
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">{DISCLAIMER}</p>
      </footer>
    </div>
  )
}
