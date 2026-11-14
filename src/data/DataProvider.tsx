import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { decryptToString, EncFileSchema, WrongPasscodeError, type EncFile } from '@/lib/crypto'
import { parseDataFile } from '@/lib/schema'
import { DataContext, type DataState } from './context'

const STORAGE_KEY = 'fcd.passcode'

/** Per-firm access: each firm has its own file and passphrase (see scripts/encrypt-firms.ts). */
export const PER_FIRM = import.meta.env.VITE_PER_FIRM === '1'

/** The firm in the current URL (`#/firm/F00126?...`), or null. Only ever a plain id, never a path. */
function firmIdFromHash(): string | null {
  return /^#\/firm\/([A-Za-z0-9_-]+)(?:[/?]|$)/.exec(window.location.hash)?.[1] ?? null
}

function useFirmId(): string | null {
  const [id, setId] = useState(firmIdFromHash)
  useEffect(() => {
    const update = () => setId(firmIdFromHash())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return id
}

// sessionStorage can throw (private mode, blocked storage); never let that break the app.
const keyFor = (firmId: string | null) => (firmId ? `${STORAGE_KEY}.${firmId}` : STORAGE_KEY)
const storage = {
  get(firmId: string | null): string | null {
    try {
      return sessionStorage.getItem(keyFor(firmId))
    } catch {
      return null
    }
  },
  set(firmId: string | null, value: string) {
    try {
      sessionStorage.setItem(keyFor(firmId), value)
    } catch {
      /* ignore */
    }
  },
  remove(firmId: string | null) {
    try {
      sessionStorage.removeItem(keyFor(firmId))
    } catch {
      /* ignore */
    }
  },
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: 'loading-file' })
  const encRef = useRef<EncFile | null>(null)
  const hashFirm = useFirmId()
  // Demo mode: one file with every firm. Per-firm mode: the firm named in the link.
  const firmId = PER_FIRM ? hashFirm : null

  const attemptUnlock = useCallback(async (passcode: string, silent: boolean) => {
    const enc = encRef.current
    if (!enc) return
    setState({ status: 'unlocking', silent })
    let plaintext: string
    try {
      plaintext = await decryptToString(enc, passcode)
    } catch (err) {
      if (err instanceof WrongPasscodeError) {
        storage.remove(firmId)
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
    storage.set(firmId, passcode)
    setState({
      status: 'ready',
      data: parsed.data,
      firmsById: new Map(parsed.data.firms.map((f) => [f.firm_id, f])),
      unlockedBy: silent ? 'silent' : 'typed',
    })
  }, [firmId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      encRef.current = null
      if (PER_FIRM && firmId === null) {
        setState({ status: 'no-firm' })
        return
      }
      setState({ status: 'loading-file' })
      const url = PER_FIRM ? `${import.meta.env.BASE_URL}data/firms/${firmId}.enc` : `${import.meta.env.BASE_URL}data/firms.enc`
      let body: unknown
      try {
        const res = await fetch(url, { cache: 'no-cache' })
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
      const stored = storage.get(firmId)
      if (stored) await attemptUnlock(stored, true)
      else setState({ status: 'locked' })
    })()
    return () => {
      cancelled = true
    }
  }, [attemptUnlock, firmId])

  const unlock = useCallback((passcode: string) => attemptUnlock(passcode, false), [attemptUnlock])
  const lock = useCallback(() => {
    storage.remove(firmId)
    setState({ status: 'locked' })
  }, [firmId])

  const value = useMemo(() => ({ state, unlock, lock }), [state, unlock, lock])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
