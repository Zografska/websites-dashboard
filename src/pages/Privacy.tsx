import { MarkdownArticle } from '@/components/MarkdownArticle'
import { Button } from '@/components/ui/button'
import { PRIVACY_NOTICE } from '@/content/privacy'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocale, useT } from '@/i18n/context'
import { analytics } from '@/lib/analytics'
import { POLICY_DATE, POLICY_V, useConsent } from '@/lib/consent'
import { formatDate } from '@/lib/format'


// Same look for both; the pressed one is the current choice.
const CHOICE = 'h-auto min-h-8 flex-1 py-1.5 whitespace-normal tab:w-60 tab:flex-none aria-pressed:bg-primary! aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90!'

/** The privacy notice (ANALYTICS_SPEC §5.3). Readable without the passphrase. */
export default function Privacy() {
  const t = useT()
  const { locale } = useLocale()
  const consent = useConsent()
  useDocumentTitle(t.nav.privacy)

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground" data-testid="privacy-version">
        {t.privacy.version(POLICY_V, formatDate(POLICY_DATE, locale))}
      </p>
      <MarkdownArticle>{PRIVACY_NOTICE[locale]}</MarkdownArticle>
      <section aria-labelledby="privacy-choice" className="space-y-3 rounded-xl border p-4 tab:p-6" data-testid="privacy-choice" data-consent={consent ?? 'none'}>
        <h2 id="privacy-choice" className="text-base font-medium">
          {t.privacy.choiceHeading}
        </h2>
        <p className="text-sm" role="status">
          {t.privacy.choice[consent ?? 'none']}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className={CHOICE} aria-pressed={consent === 'granted'} onClick={() => analytics.setConsent('granted', 'privacy_page')}>
            {t.consent.accept}
          </Button>
          <Button variant="outline" size="sm" className={CHOICE} aria-pressed={consent === 'denied'} onClick={() => analytics.setConsent('denied', 'privacy_page')}>
            {t.consent.decline}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t.privacy.choiceNote}</p>
      </section>
    </div>
  )
}
