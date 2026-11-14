import { XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/context'
import { analytics, ANALYTICS_ENABLED } from '@/lib/analytics'
import { useConsent } from '@/lib/consent'

/**
 * The consent prompt for the optional engagement measurement (ANALYTICS_SPEC §5.1).
 * It sits at the bottom of the page and never blocks it. Accept and Decline look the same;
 * closing counts as Decline. Shown until a choice is made, and only in builds that can track.
 */
export function ConsentBanner() {
  const consent = useConsent()
  if (!ANALYTICS_ENABLED || consent !== null) return null
  return <Banner />
}

function Banner() {
  const t = useT()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const decline = () => analytics.setConsent('denied', 'banner')
  const choice = 'flex-1 tab:w-28 tab:flex-none'

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={t.consent.label}
      data-testid="consent-banner"
      className="sticky bottom-0 z-40 border-t bg-background shadow-[0_-4px_16px_rgb(0_0_0/0.08)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 tab:flex-row tab:items-center tab:gap-6">
        <p className="pr-8 text-xs leading-snug text-foreground tab:flex-1 tab:pr-0 tab:text-sm">
          {t.consent.body}{' '}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-muted-foreground">
            {t.consent.notice}
          </Link>
        </p>
        <div className="flex gap-2">
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
