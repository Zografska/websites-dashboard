import { createContext, useContext } from 'react'
import { MESSAGES, type Locale, type Messages } from './messages'

export type LocaleContextValue = { locale: Locale; setLocale: (l: Locale) => void }

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}

/** The UI messages for the current locale. */
export function useT(): Messages {
  return MESSAGES[useLocale().locale]
}
