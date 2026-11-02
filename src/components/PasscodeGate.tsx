import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useT } from '@/i18n/context'

type Props = { busy: boolean; error?: string; onUnlock: (passcode: string) => void }

export function PasscodeGate({ busy, error, onUnlock }: Props) {
  const t = useT()
  const [passcode, setPasscode] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (passcode && !busy) onUnlock(passcode)
  }

  return (
    <div className="flex justify-center py-10 tab:py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t.appTitle}</CardTitle>
          <CardDescription>{t.gate.prompt}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="passcode" className="text-sm font-medium">
                {t.gate.label}
              </label>
              <Input
                id="passcode"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'passcode-error' : undefined}
              />
              {error && (
                <p id="passcode-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy || passcode === ''}>
              {busy ? t.gate.unlocking : t.gate.unlock}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
