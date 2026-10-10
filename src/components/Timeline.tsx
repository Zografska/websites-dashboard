import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { categoryColorVar, categoryLabel } from '@/lib/categories'
import { timelineSeries, type TimelinePoint } from '@/lib/derive'
import { formatDate } from '@/lib/format'
import type { Filters, Firm } from '@/lib/types'

type Props = { firm: Firm; filters: Filters; categories: readonly string[] }

const TOTAL_COLOR = 'var(--foreground)'

/** Filled dot for ok crawls, hollow for partial ones (≥ 8px markers). */
function crawlDot(color: string, r = 4) {
  return function Dot(props: { cx?: number; cy?: number; payload?: unknown; index?: number; value?: unknown }) {
    const { cx, cy, index } = props
    const payload = props.payload as TimelinePoint | undefined
    if (cx == null || cy == null || payload == null || props.value == null) return <g key={`d${index}`} />
    const partial = payload.status === 'partial'
    return (
      <circle
        key={`d${index}`}
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={2}
        fill={partial ? 'var(--background)' : color}
        data-status={payload.status}
      />
    )
  }
}

function TimelineTooltip({
  active,
  payload,
  split,
}: {
  active?: boolean
  payload?: { payload: TimelinePoint }[]
  split: string[]
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const status =
    point.status === 'failed' ? 'Crawl failed' : point.status === 'partial' ? `Partial crawl (${point.pages_scraped} pages)` : `${point.pages_scraped} pages`
  return (
    <div className="grid min-w-40 gap-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <div className="font-medium">{formatDate(point.crawled_at)}</div>
      <div className="text-muted-foreground">{status}</div>
      {point.total !== null && (
        <div className="flex justify-between gap-4">
          <span>Claims</span>
          <span className="font-mono font-medium tabular-nums">{point.total}</span>
        </div>
      )}
      {point.total !== null &&
        split.map((c) => (
          <div key={c} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: `var(--color-${c})` }} />
              {categoryLabel(c)}
            </span>
            <span className="font-mono tabular-nums">{point[c] as number}</span>
          </div>
        ))}
    </div>
  )
}

export function Timeline({ firm, filters, categories }: Props) {
  const [split, setSplit] = useState(false) // local, not in the URL (D14)

  const selected = useMemo(() => filters.categories ?? [...categories], [filters.categories, categories])
  const points = useMemo(() => timelineSeries(firm, filters, split ? selected : null), [firm, filters, split, selected])
  // Only categories with at least one non-zero point get a line.
  const lines = split ? selected.filter((c) => points.some((p) => typeof p[c] === 'number' && (p[c] as number) > 0)) : []
  const dateById = new Map(points.map((p) => [p.crawl_id, p.crawled_at]))

  const config: ChartConfig = {
    total: { label: 'All claims', color: TOTAL_COLOR },
    ...Object.fromEntries(lines.map((c) => [c, { label: categoryLabel(c), color: categoryColorVar(c, categories) }])),
  }

  return (
    <section aria-labelledby="timeline-heading" className="min-w-0 space-y-2" data-testid="timeline">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="timeline-heading" className="text-lg font-semibold">
          Claims per crawl
        </h2>
        <Button variant="outline" size="sm" aria-pressed={split} onClick={() => setSplit((s) => !s)}>
          {split ? 'Show total only' : 'Split by category'}
        </Button>
      </div>

      <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
        <LineChart data={points} margin={{ top: 16, right: 16, bottom: 4, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="crawl_id"
            tickFormatter={(id: string) => formatDate(dateById.get(id) ?? '')}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            padding={{ left: 16, right: 16 }}
          />
          <YAxis allowDecimals={false} domain={[0, 'auto']} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<TimelineTooltip split={lines} />} />
          {points
            .filter((p) => p.status === 'failed')
            .map((p) => (
              <ReferenceLine
                key={p.crawl_id}
                x={p.crawl_id}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{ value: 'Crawl failed', position: 'insideTop', fill: 'var(--muted-foreground)', fontSize: 11 }}
                data-testid="failed-crawl-marker"
              />
            ))}
          {lines.map((c) => (
            <Line
              key={c}
              dataKey={c}
              name={categoryLabel(c)}
              type="linear"
              stroke={`var(--color-${c})`}
              strokeWidth={2}
              connectNulls={false}
              dot={crawlDot(`var(--color-${c})`, 3)}
              isAnimationActive={false}
            />
          ))}
          <Line
            dataKey="total"
            name="All claims"
            type="linear"
            stroke="var(--color-total)"
            strokeWidth={split ? 3 : 2}
            connectNulls={false}
            dot={crawlDot('var(--color-total)')}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>

      {split && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend" data-testid="timeline-legend">
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-foreground" style={{ height: 3 }} />
            All claims
          </li>
          {lines.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ backgroundColor: categoryColorVar(c, categories) }} />
              {categoryLabel(c)}
            </li>
          ))}
        </ul>
      )}
      {firm.crawls.length === 1 && <p className="text-xs text-muted-foreground">Only one crawl so far</p>}
      <p className="text-xs text-muted-foreground">Claims found at each crawl, after the current filters. Hollow dot = partial crawl.</p>
    </section>
  )
}
