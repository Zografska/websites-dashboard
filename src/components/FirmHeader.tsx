import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { confidenceCounts, getLatestCrawl, getNewestCrawl, highestConfidence } from '@/lib/derive'
import { CONFIDENCE_TOOLTIP, formatDate, formatDateWithStatus, hostname } from '@/lib/format'
import type { Firm } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfidenceCounters } from './ConfidenceCounters'

export function FirmHeader({ firm }: { firm: Firm }) {
  const latest = getLatestCrawl(firm)
  const newest = getNewestCrawl(firm)
  const highest = highestConfidence(firm)
  const notes: string[] = []
  if (latest === null) notes.push('No successful crawl yet.')
  else {
    if (latest.crawl_id !== newest.crawl_id) notes.push(`Claims as of ${formatDate(latest.crawled_at)} (latest successful crawl).`)
    if (latest.status === 'partial') notes.push(`Latest crawl was partial (${latest.pages_scraped} pages). Some claims may be missing.`)
  }

  return (
    <header className="grid gap-4 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-start">
      <div className="min-w-0 space-y-1">
        <h1 className="font-mono text-3xl font-semibold tracking-tight">{firm.firm_id}</h1>
        <p className="text-lg">{firm.firm_name}</p>
        <a
          href={firm.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {hostname(firm.website)} ↗
        </a>
        <p className="pt-2 text-sm text-muted-foreground" data-testid="crawl-meta">
          Last crawled {formatDateWithStatus(newest.crawled_at, newest.status)} · {firm.crawls.length} {firm.crawls.length === 1 ? 'crawl' : 'crawls'}
        </p>
        {notes.map((n) => (
          <p key={n} className="text-sm text-muted-foreground" data-testid="crawl-note">
            {n}
          </p>
        ))}
      </div>

      <section
        data-testid="confidence-block"
        data-highest={highest ?? 'none'}
        aria-labelledby="confidence-block-title"
        className={cn('space-y-2 rounded-md border-l-4 py-2 pr-2 pl-3', highest === null && 'border')}
        style={{ borderLeftColor: `var(--conf-${highest ?? 'none'})` }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <h2 id="confidence-block-title" tabIndex={0} className="w-fit cursor-help text-sm font-medium underline decoration-dotted underline-offset-4">
              Detection confidence
            </h2>
          </TooltipTrigger>
          <TooltipContent>{CONFIDENCE_TOOLTIP}</TooltipContent>
        </Tooltip>
        <ConfidenceCounters counts={confidenceCounts(firm)} variant="tiles" />
        <p className="text-xs text-muted-foreground">Present claims in the latest crawl. {CONFIDENCE_TOOLTIP}.</p>
      </section>
    </header>
  )
}
