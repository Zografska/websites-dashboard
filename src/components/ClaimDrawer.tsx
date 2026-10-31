import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLocale, useT } from '@/i18n/context'
import { claimAdvice } from '@/i18n/advice'
import { areaOf, claimLight } from '@/lib/areas'
import { categoryLabel } from '@/lib/categories'
import { getLatestCrawl } from '@/lib/derive'
import { withParam } from '@/lib/filters'
import { formatDate, legalRefLabel, stripProtocol } from '@/lib/format'
import type { Claim, Firm } from '@/lib/types'
import { LightLabel } from './Light'

type Props = { firm: Firm }

export function ClaimDrawer({ firm }: Props) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const wide = useMediaQuery('(min-width: 700px)')
  const claimId = params.get('claim')
  const claim = claimId === null ? undefined : firm.claims.find((c) => c.claim_id === claimId)
  const state = location.state as { drawerFromList?: boolean } | null

  const removeParam = () => navigate({ search: withParam(location.search, 'claim', null) }, { replace: true, state: location.state })

  // An unknown claim id is dropped from the URL; the drawer stays closed.
  useEffect(() => {
    if (claimId !== null && !claim) removeParam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId, claim])

  const close = () => {
    if (state?.drawerFromList) navigate(-1)
    else removeParam()
  }

  return (
    <Sheet open={claim !== undefined} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={wide ? 'right' : 'bottom'}
        data-testid="claim-drawer"
        showCloseButton={false} // our own, so its label is translated (shadcn files stay untouched)
        className={wide ? 'w-full overflow-y-auto sm:max-w-lg!' : 'max-h-[85vh] overflow-y-auto'}
      >
        {claim && <DrawerBody claim={claim} firm={firm} />}
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

function DrawerBody({ claim, firm }: { claim: Claim; firm: Firm }) {
  const t = useT()
  const { locale } = useLocale()
  const latest = getLatestCrawl(firm)
  const advice = claimAdvice(claim, locale)
  return (
    <>
      <SheetClose asChild>
        <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm">
          <XIcon />
          <span className="sr-only">{t.drawer.close}</span>
        </Button>
      </SheetClose>
      <SheetHeader className="pr-12">
        <SheetTitle lang="it" className="text-lg leading-snug">
          {claim.text}
        </SheetTitle>
        <SheetDescription className="sr-only">{t.drawer.details}</SheetDescription>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge variant="outline" className="gap-1.5">
            <LightLabel light={claimLight(claim)} />
          </Badge>
          <Badge variant="outline" className="max-w-full" data-testid="area-chip">
            <span className="truncate">{t.areas[areaOf(claim.category)].title}</span>
          </Badge>
          <Badge variant="outline" className={claim.scope_status === 'NEEDS_VERIFICATION' ? 'border-dashed border-foreground/50' : undefined}>
            {t.scope.label[claim.scope_status]}
          </Badge>
        </div>
      </SheetHeader>

      <div className="space-y-5 px-4 pb-6">
        <Section title={t.overview.why}>
          <p className="text-sm">{advice.why}</p>
        </Section>
        <Section title={t.overview.verify}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {advice.verify.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </Section>
        <Section title={t.overview.action}>
          <p className="text-sm">{advice.action}</p>
        </Section>

        <Separator />

        {claim.context_snippet !== '' && (
          <Section title={t.drawer.context}>
            <blockquote lang="it" className="border-l-2 pl-3 text-sm leading-relaxed" data-testid="context-snippet">
              <Highlighted snippet={claim.context_snippet} text={claim.text} />
            </blockquote>
          </Section>
        )}

        <Section title={t.drawer.source}>
          <a
            href={claim.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all underline underline-offset-4 hover:text-muted-foreground"
          >
            {stripProtocol(claim.source_url)}
          </a>
          {latest && <p className="text-xs text-muted-foreground">{t.drawer.scraped(formatDate(latest.crawled_at, locale))}</p>}
        </Section>

        <Section title={t.drawer.legalRef}>
          <p className="text-sm" data-testid="legal-ref">
            {legalRefLabel(claim.legal_ref, locale)}
          </p>
          <p className="text-xs text-muted-foreground">{t.drawer.legalNote}</p>
        </Section>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t.drawer.category}</dt>
          <dd>{categoryLabel(claim.category, locale)}</dd>
          <dt className="text-muted-foreground" title={t.confidence.tooltip}>
            {t.confidence.heading}
          </dt>
          <dd data-testid="confidence">
            {t.confidence.label[claim.confidence]} <span className="text-xs text-muted-foreground">({t.confidence.tooltip.toLowerCase()})</span>
          </dd>
          {claim.gray_zone !== null && (
            <>
              <dt className="text-muted-foreground">{t.drawer.grayZone}</dt>
              <dd className="font-mono">{claim.gray_zone}</dd>
            </>
          )}
        </dl>
      </div>
    </>
  )
}
