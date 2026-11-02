import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { decryptToString, EncFileSchema, WrongPasscodeError, type EncFile } from '@/lib/crypto'
import { parseDataFile } from '@/lib/schema'
import { DataContext, type DataState } from './context'

const STORAGE_KEY = 'fcd.passcode'

// sessionStorage can throw (private mode, blocked storage); never let that break the app.
const storage = {
  get(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(value: string) {
    try {
      sessionStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  },
  remove() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: 'loading-file' })
  const encRef = useRef<EncFile | null>(null)

  const attemptUnlock = useCallback(async (passcode: string, silent: boolean) => {
    const enc = encRef.current
    if (!enc) return
    setState({ status: 'unlocking', silent })
    let plaintext: string
    try {
      plaintext = await decryptToString(enc, passcode)
    } catch (err) {
      if (err instanceof WrongPasscodeError) {
        storage.remove()
        setState(silent ? { status: 'locked' } : { status: 'locked', error: 'wrong-passcode' })
      } else {
        setState({ status: 'file-error', reason: 'invalid-file' })
      }
      return
    }
    let json: unknown
    try {
      json = JSON.parse(plaintext)
    } catch {
      setState({ status: 'data-error', reason: 'invalid-json', issues: [] })
      return
    }
    const parsed = parseDataFile(json)
    if (!parsed.ok) {
      setState({ status: 'data-error', reason: 'validation', issues: parsed.issues })
      return
    }
    storage.set(passcode)
    setState({ status: 'ready', data: parsed.data, firmsById: new Map(parsed.data.firms.map((f) => [f.firm_id, f])) })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let body: unknown
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/firms.enc`, { cache: 'no-cache' })
        if (!res.ok) throw new Error(String(res.status))
        body = await res.json().catch(() => null)
      } catch {
        if (!cancelled) setState({ status: 'file-error', reason: 'not-found' })
        return
      }
      if (cancelled) return
      const enc = EncFileSchema.safeParse(body)
      if (!enc.success) {
        setState({ status: 'file-error', reason: 'invalid-file' })
        return
      }
      encRef.current = enc.data
      const stored = storage.get()
      if (stored) await attemptUnlock(stored, true)
      else setState({ status: 'locked' })
    })()
    return () => {
      cancelled = true
    }
  }, [attemptUnlock])

  const unlock = useCallback((passcode: string) => attemptUnlock(passcode, false), [attemptUnlock])
  const lock = useCallback(() => {
    storage.remove()
    setState({ status: 'locked' })
  }, [])

  const value = useMemo(() => ({ state, unlock, lock }), [state, unlock, lock])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
