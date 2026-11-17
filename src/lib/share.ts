// Sharing the report link (privacy notice v2, section III: "l'uso della funzione di condivisione").
// Only the firm's report link is shared, never the access code.

export type ShareMethod = 'native' | 'copy'
export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'failed'
export type ShareResult = { method: ShareMethod; outcome: ShareOutcome }
export type ShareData = { url: string; title: string; text: string }

type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>
  clipboard?: { writeText: (text: string) => Promise<void> }
}

/** The firm's report link, the same one the firm received: no tab, filter or claim in it. */
export function reportLink(firmId: string, loc: Pick<Location, 'origin' | 'pathname'> = window.location): string {
  return `${loc.origin}${loc.pathname}#/firm/${encodeURIComponent(firmId)}`
}

/**
 * Opens the system share sheet when there is one, otherwise copies the link.
 * A share sheet that fails for any reason other than the visitor closing it falls back to copying.
 */
export async function shareLink(data: ShareData, nav: ShareNavigator = navigator as ShareNavigator): Promise<ShareResult> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share(data)
      return { method: 'native', outcome: 'shared' }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return { method: 'native', outcome: 'cancelled' }
    }
  }
  try {
    if (!nav.clipboard) throw new Error('no clipboard')
    await nav.clipboard.writeText(data.url)
    return { method: 'copy', outcome: 'copied' }
  } catch {
    return { method: 'copy', outcome: 'failed' }
  }
}
