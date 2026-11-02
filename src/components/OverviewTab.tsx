import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useOpenClaim } from '@/hooks/useOpenClaim'
import { claimAdvice } from '@/i18n/advice'
import { useLocale, useT } from '@/i18n/context'
import { claimLight, type AreaSummary, type ReviewSummary } from '@/lib/areas'
import { sourceLabel } from '@/lib/format'
import { AREAS, type Area } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AreaBar, LightDot, LightLabel } from './Light'
import { lightColor, lightTextColor } from './lightStyle'

type Props = {
  summaries: AreaSummary[]
  review: ReviewSummary
  focus: Area
  onFocus: (area: Area) => void
  onSeeAll: (area: Area) => void
}

export function OverviewTab({ summaries, review, focus, onFocus, onSeeAll }: Props) {
  const t = useT()
  const selected = summaries.find((s) => s.area === focus) ?? summaries[0]
  return (
    <div className="space-y-6">
      <StatCards review={review} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <section aria-labelledby="areas-heading" className="space-y-3">
          <h2 id="areas-heading" className="text-base font-medium">
            {review.merit > 0 ? t.overview.areasHeading(AREAS.length) : t.overview.areasHeadingAll}
          </h2>
          <ul className="space-y-2">
            {summaries.map((s) => (
              <li key={s.area}>
                <AreaItem summary={s} selected={s.area === selected.area} onSelect={() => onFocus(s.area)} />
              </li>
            ))}
          </ul>
        </section>
        <AreaPanel key={selected.area} summary={selected} onSeeAll={() => onSeeAll(selected.area)} />
      </div>
    </div>
  )
}

function StatCards({ review }: { review: ReviewSummary }) {
  const t = useT()
  const total = AREAS.length
  const card = 'rounded-xl border p-4'
  const small = (label: string, n: number, note: string, testId: string) => (
    <div className={card} data-testid={testId}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{n}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
  return (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <div className={cn(card, 'col-span-3 space-y-3 lg:col-span-1')} data-testid="review-summary">
        <p className="text-2xl font-semibold tracking-tight">{t.review.merit(review.merit, total)}</p>
        <AreaBar lights={review.lights} label={`${t.review.merit(review.merit, total)}: ${t.review.detail(review.red, review.yellow)}`} />
      </div>
      {small(t.overview.redAreas, review.red, t.light.action.red, 'red-areas')}
      {small(t.overview.yellowAreas, review.yellow, t.light.action.yellow, 'yellow-areas')}
      {small(t.overview.greenAreas, review.green, t.light.action.green, 'green-areas')}
    </div>
  )
}

function AreaItem({ summary, selected, onSelect }: { summary: AreaSummary; selected: boolean; onSelect: () => void }) {
  const t = useT()
  const text = t.areas[summary.area]
  const n = summary.claims.length
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      data-testid="area-item"
      data-area={summary.area}
      data-light={summary.light}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        selected && 'border-foreground/40 bg-muted/50 ring-1 ring-foreground/20',
      )}
    >
      <LightDot light={summary.light} className="size-3" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{text.title}</span>
        <span className="block text-sm text-muted-foreground">{text.subtitle}</span>
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">{n > 0 ? t.overview.examples(n) : t.overview.noneFound}</span>
      <span className="sr-only">{t.light.label[summary.light]}</span>
    </button>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

function AreaPanel({ summary, onSeeAll }: { summary: AreaSummary; onSeeAll: () => void }) {
  const t = useT()
  const { locale } = useLocale()
  const openClaim = useOpenClaim()
  const [index, setIndex] = useState(0)
  const text = t.areas[summary.area]
  const n = summary.claims.length
  const claim = n > 0 ? summary.claims[Math.min(index, n - 1)] : null
  const advice = claim ? claimAdvice(claim, locale) : null

  return (
    <section className="space-y-5 rounded-xl border p-4 tab:p-6" aria-labelledby="area-panel-title" data-testid="area-panel" data-area={summary.area}>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: lightTextColor(summary.light) }}>
          <LightDot light={summary.light} />
          {t.light.tag[summary.light]}
        </p>
        <h2 id="area-panel-title" className="text-2xl font-semibold tracking-tight">
          {text.title}
        </h2>
        <p className="text-sm text-muted-foreground">{text.guidance}</p>
      </div>

      {claim === null || advice === null ? (
        <p className="text-sm text-muted-foreground" data-testid="area-empty">
          {t.overview.emptyArea}
        </p>
      ) : (
        <>
          <figure className="space-y-3 rounded-md border-l-4 bg-muted/50 p-4" style={{ borderLeftColor: lightColor(claimLight(claim)) }} data-testid="area-example">
            <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t.overview.exampleDetected}
              <LightLabel light={claimLight(claim)} className="normal-case" />
            </figcaption>
            <blockquote lang="it" className="text-lg leading-snug">
              “{claim.text}”
            </blockquote>
            <a
              href={claim.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {sourceLabel(claim.source_url)} ↗
            </a>
          </figure>

          <Block title={t.overview.why}>
            <p className="text-sm text-muted-foreground">{advice.why}</p>
          </Block>
          <Block title={t.overview.verify}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {advice.verify.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </Block>
          <div className="space-y-1.5 rounded-md bg-muted p-4">
            <h3 className="text-sm font-medium">{t.overview.action}</h3>
            <p className="text-sm text-muted-foreground">{advice.action}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {n > 1 && (
              <div className="flex items-center gap-1" data-testid="example-nav">
                <Button variant="outline" size="icon-sm" aria-label={t.overview.previous} disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <ChevronLeftIcon />
                </Button>
                <span className="min-w-14 text-center text-sm tabular-nums">{t.overview.of(index + 1, n)}</span>
                <Button variant="outline" size="icon-sm" aria-label={t.overview.next} disabled={index >= n - 1} onClick={() => setIndex(index + 1)}>
                  <ChevronRightIcon />
                </Button>
              </div>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => openClaim(claim.claim_id)}>
                {t.overview.details}
              </Button>
              <Button variant="outline" size="sm" onClick={onSeeAll}>
                {t.overview.seeAll(n)}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
