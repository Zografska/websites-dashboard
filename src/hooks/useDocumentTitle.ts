import { useEffect } from 'react'
import { useT } from '@/i18n/context'

/** Sets `document.title` to `${prefix} · <app title>`, or the bare app title, in the current locale. */
export function useDocumentTitle(prefix?: string) {
  const { appTitle } = useT()
  useEffect(() => {
    document.title = prefix ? `${prefix} · ${appTitle}` : appTitle
  }, [prefix, appTitle])
}
