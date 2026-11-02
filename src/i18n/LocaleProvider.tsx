import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext } from './context'
import { LOCALES, type Locale } from './messages'

const STORAGE_KEY = 'fcd.lang'

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v)
}

/** The saved choice, else the browser language if it's Italian, else English. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* storage blocked: fall through */
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale: (l: Locale) => {
        setLocaleState(l)
        try {
          localStorage.setItem(STORAGE_KEY, l)
        } catch {
          /* ignore */
        }
      },
    }),
    [locale],
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
