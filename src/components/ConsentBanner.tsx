import { ChevronDownIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { Button } from '@/components/ui/button'
import { PRIVACY_NOTICE } from '@/content/privacy'
import { useLocale, useT } from '@/i18n/context'
import { analytics, ANALYTICS_ENABLED } from '@/lib/analytics'
import { useConsent } from '@/lib/consent'
import { cn } from '@/lib/utils'

/**
 * The consent prompt for the optional engagement measurement (ANALYTICS_SPEC §5.1).
 * It sits at the bottom of the page and never blocks it. The two choices look the same;
 * closing means continuing without measurement. "Privacy notice" expands the full notice
 * inside the banner. Shown until a choice is made, and only in builds that can track.
 */
export function ConsentBanner() {
  const consent = useConsent()
  if (!ANALYTICS_ENABLED || consent !== null) return null
  return <Banner />
}

function Banner() {
  const t = useT()
  const { locale } = useLocale()
  const ref = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const decline = () => analytics.setConsent('denied', 'banner')
  // Same size and style for both, whatever the label length.
  const choice = 'h-auto min-h-8 py-1.5 whitespace-normal'

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={t.consent.label}
      data-testid="consent-banner"
      className="sticky bottom-0 z-40 border-t bg-background shadow-[0_-4px_16px_rgb(0_0_0/0.08)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {expanded && (
        <div id="consent-notice" data-testid="consent-notice" tabIndex={0} className="max-h-[55vh] overflow-y-auto border-b">
          <MarkdownArticle className="mx-auto max-w-6xl px-4 py-4 prose-sm">{PRIVACY_NOTICE[locale]}</MarkdownArticle>
        </div>
      )}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 tab:flex-row tab:items-center tab:gap-6 tab:py-3">
        <p className="pr-8 text-xs leading-snug text-foreground tab:flex-1 tab:pr-0 tab:text-sm">
          {t.consent.body}{' '}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="consent-notice"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-0.5 font-medium text-link underline underline-offset-4 hover:text-muted-foreground"
          >
            {t.consent.notice}
            <ChevronDownIcon aria-hidden className={cn('size-3.5 transition-transform', expanded ? '' : 'rotate-180')} />
          </button>
        </p>
        <div className="grid grid-cols-2 gap-2 tab:w-[26rem] tab:shrink-0">
          <Button variant="outline" size="sm" className={choice} onClick={() => analytics.setConsent('granted', 'banner')}>
            {t.consent.accept}
          </Button>
          <Button variant="outline" size="sm" className={choice} onClick={decline}>
            {t.consent.decline}
          </Button>
        </div>
        <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 tab:static" aria-label={t.consent.close} title={t.consent.close} onClick={decline}>
          <XIcon />
        </Button>
      </div>
    </section>
  )
}
