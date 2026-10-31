import { createContext, useContext } from 'react'
import type { DataIssue } from '@/lib/schema'
import type { DataFile, Firm } from '@/lib/types'

export type ReadyData = { data: DataFile; firmsById: Map<string, Firm> }

// Errors are codes, not text: the UI translates them.
export type DataState =
  | { status: 'loading-file' }
  | { status: 'file-error'; reason: 'not-found' | 'invalid-file' }
  | { status: 'locked'; error?: 'wrong-passcode' }
  | { status: 'unlocking'; silent: boolean }
  | { status: 'data-error'; reason: 'invalid-json' | 'validation'; issues: DataIssue[] }
  | ({ status: 'ready' } & ReadyData)

export type DataContextValue = {
  state: DataState
  unlock: (passcode: string) => Promise<void>
  lock: () => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useDataState(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataState must be used inside <DataProvider>')
  return ctx
}

/** The decrypted, validated data. Throws outside the `ready` state (pages only render when ready). */
export function useData(): ReadyData {
  const { state } = useDataState()
  if (state.status !== 'ready') throw new Error(`useData called in state ${state.status}`)
  return state
}
