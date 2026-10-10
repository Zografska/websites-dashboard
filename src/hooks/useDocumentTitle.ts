import { useEffect } from 'react'

export const APP_TITLE = 'Firm Claims Dashboard'

/** Sets `document.title` to `${prefix} · Firm Claims Dashboard`, or the bare app title. */
export function useDocumentTitle(prefix?: string) {
  useEffect(() => {
    document.title = prefix ? `${prefix} · ${APP_TITLE}` : APP_TITLE
  }, [prefix])
}
