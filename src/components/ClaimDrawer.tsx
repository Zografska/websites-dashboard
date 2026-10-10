import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { crawlHistory, firstSeen, getLatestCrawl, isPresent, lastSeen } from '@/lib/derive'
import { withParam } from '@/lib/filters'
import { formatDate, legalRefLabel, SCOPE_LABEL, stripProtocol } from '@/lib/format'
import type { Claim, Firm } from '@/lib/types'
import { CategoryChip } from './CategoryChip'
import { ConfidenceBadge } from './ConfidenceBadge'

type Props = { firm: Firm; categories: readonly string[] }

export function ClaimDrawer({ firm, categories }: Props) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const wide = useMediaQuery('(min-width: 700px)')
  const claimId = params.get('claim')
  const claim = claimId === null ? undefined : firm.claims.find((c) => c.claim_id === claimId)
  const state = location.state as { drawerFromStrip?: boolean } | null

  const removeParam = () => navigate({ search: withParam(location.search, 'claim', null) }, { replace: true, state: location.state })

  // An unknown claim id is dropped from the URL; the drawer stays closed.
  useEffect(() => {
    if (claimId !== null && !claim) removeParam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId, claim])

  const close = () => {
    if (state?.drawerFromStrip) navigate(-1)
    else removeParam()
  }

  return (
    <Sheet open={claim !== undefined} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={wide ? 'right' : 'bottom'}
        data-testid="claim-drawer"
        className={wide ? 'w-full overflow-y-auto sm:max-w-lg!' : 'max-h-[85vh] overflow-y-auto'}
      >
        {claim && <DrawerBody claim={claim} firm={firm} categories={categories} />}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

/** Splits the snippet around the first case-insensitive match of the claim text (no innerHTML). */
function Highlighted({ snippet, text }: { snippet: string; text: string }) {
  const i = snippet.toLowerCase().indexOf(text.toLowerCase())
  if (i < 0) return <>{snippet}</>
  return (
    <>
      {snippet.slice(0, i)}
      <mark className="rounded-sm bg-foreground/10 px-0.5 font-semibold text-foreground underline decoration-foreground/40 underline-offset-2">{snippet.slice(i, i + text.length)}</mark>
      {snippet.slice(i + text.length)}
    </>
  )
}

function DrawerBody({ claim, firm, categories }: { claim: Claim; firm: Firm; categories: readonly string[] }) {
  const present = isPresent(claim, getLatestCrawl(firm))
  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle lang="it" className="text-lg leading-snug">
          {claim.text}
        </SheetTitle>
        <SheetDescription className="sr-only">Details for this claim</SheetDescription>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <CategoryChip category={claim.category} categories={categories} />
          <ConfidenceBadge level={claim.confidence} />
          <Badge variant="outline" className={claim.scope_status === 'NEEDS_VERIFICATION' ? 'border-dashed border-foreground/50' : undefined}>
            {SCOPE_LABEL[claim.scope_status]}
          </Badge>
          {!present && <Badge variant="secondary">Removed</Badge>}
        </div>
      </SheetHeader>

      <div className="space-y-5 px-4 pb-6">
        {claim.context_snippet !== '' && (
          <Section title="Context">
            <blockquote lang="it" className="border-l-2 pl-3 text-sm leading-relaxed" data-testid="context-snippet">
              <Highlighted snippet={claim.context_snippet} text={claim.text} />
            </blockquote>
          </Section>
        )}

        <Section title="Source">
          <a
            href={claim.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all underline underline-offset-4 hover:text-muted-foreground"
          >
            {stripProtocol(claim.source_url)}
          </a>
        </Section>

        <Section title="Legal reference">
          <p className="text-sm" data-testid="legal-ref">
            {legalRefLabel(claim.legal_ref)}
          </p>
          <p className="text-xs text-muted-foreground">Indicative mapping, not a legal assessment.</p>
        </Section>

        {claim.gray_zone !== null && (
          <Section title="Gray zone">
            <p className="font-mono text-sm">{claim.gray_zone}</p>
          </Section>
        )}

        <Separator />

        <Section title="Crawl history">
          <p className="text-sm">
            First seen {formatDate(firstSeen(claim, firm))} · Last seen {formatDate(lastSeen(claim, firm))}
          </p>
          <ul className="divide-y rounded-md border text-sm" data-testid="crawl-history">
            {crawlHistory(claim, firm).map(({ crawl, seen }) => (
              <li key={crawl.crawl_id} className="flex justify-between gap-3 px-3 py-1.5">
                <span className="tabular-nums">{formatDate(crawl.crawled_at)}</span>
                <span className={seen ? 'font-medium' : 'text-muted-foreground'}>
                  {crawl.status === 'failed' ? 'Crawl failed' : seen ? 'Seen' : 'Not seen'}
                  {crawl.status === 'partial' && ' (partial)'}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}
