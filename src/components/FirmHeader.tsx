import { TriangleAlertIcon } from 'lucide-react'
import { useLocale, useT } from '@/i18n/context'
import { getLatestCrawl } from '@/lib/derive'
import { formatDate, hostname } from '@/lib/format'
import type { Firm } from '@/lib/types'

export function FirmHeader({ firm }: { firm: Firm }) {
  const t = useT()
  const { locale } = useLocale()
  const latest = getLatestCrawl(firm)
  const initial = firm.firm_name.trim().charAt(0).toUpperCase()

  return (
    <header className="overflow-hidden rounded-t-xl border border-b-0">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 bg-muted/50 p-4 tab:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background text-lg font-semibold shadow-sm">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{t.firm.eyebrow}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{firm.firm_name}</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{firm.firm_id}</span>
              {' · '}
              <a href={firm.website} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-foreground hover:underline">
                {hostname(firm.website)} ↗
              </a>
            </p>
          </div>
        </div>
        <div className="basis-full text-sm tab:basis-auto tab:text-right" data-testid="crawl-meta">
          <p className="font-medium">{t.firm.sample}</p>
          <p className="text-muted-foreground">{latest ? formatDate(latest.crawled_at, locale) : t.firm.noCrawl}</p>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 text-sm tab:px-6" style={{ backgroundColor: 'var(--banner)', color: 'var(--banner-foreground)' }} data-testid="preliminary-banner">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <strong>{t.firm.banner}</strong> {t.firm.bannerBody}
        </p>
      </div>
      {latest?.status === 'partial' && (
        <p className="border-t px-4 py-2 text-sm text-muted-foreground tab:px-6" data-testid="crawl-note">
          {t.firm.partial(latest.pages_scraped)}
        </p>
      )}
    </header>
  )
}
