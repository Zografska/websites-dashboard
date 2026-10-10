import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { categoryBreakdown, type BreakdownRow } from '@/lib/derive'
import { toggleCategory } from '@/lib/filters'
import { CONFIDENCE_LABEL, CONFIDENCE_TOOLTIP } from '@/lib/format'
import { CONFIDENCES, type Confidence, type Filters, type Firm } from '@/lib/types'

type Props = { firm: Firm; filters: Filters; categories: string[]; onChange: (f: Filters) => void }

const config: ChartConfig = {
  high: { label: 'High', color: 'var(--conf-high)' },
  medium: { label: 'Medium', color: 'var(--conf-medium)' },
  low: { label: 'Low', color: 'var(--conf-low)' },
}

function BreakdownTooltip({ active, payload }: { active?: boolean; payload?: { payload: BreakdownRow }[] }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="grid min-w-40 gap-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <div className="font-medium">{row.label}</div>
      {CONFIDENCES.map((c) => (
        <div key={c} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm border" style={{ backgroundColor: `var(--conf-${c})`, borderColor: c === 'low' ? 'var(--conf-low-stroke)' : 'transparent' }} />
            {CONFIDENCE_LABEL[c]} confidence
          </span>
          <span className="font-mono tabular-nums">{row[c]}</span>
        </div>
      ))}
      <div className="text-muted-foreground">Click to toggle this category</div>
    </div>
  )
}

export function CategoryBreakdown({ firm, filters, categories, onChange }: Props) {
  const rows = useMemo(() => categoryBreakdown(firm, filters, categories), [firm, filters, categories])
  const empty = rows.every((r) => r.total === 0)
  const highlighted = (category: string) => filters.categories === null || filters.categories.includes(category)
  const toggle = (category: string) => onChange({ ...filters, categories: toggleCategory(filters.categories, category, categories) })

  return (
    <section aria-labelledby="breakdown-heading" className="min-w-0 space-y-2" data-testid="category-breakdown">
      <h2 id="breakdown-heading" className="text-lg font-semibold">
        Category breakdown
      </h2>
      {empty ? (
        <p className="flex h-[280px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No present claims in the latest crawl.
        </p>
      ) : (
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full [&_.recharts-bar-rectangle]:cursor-pointer [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper:focus-visible]:rounded-md [&_.recharts-wrapper:focus-visible]:ring-[3px] [&_.recharts-wrapper:focus-visible]:ring-ring/50">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
            barCategoryGap={6}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={(props: { x?: number | string; y?: number | string; index?: number; payload?: { value?: string } }) => {
                const row = rows[props.index ?? -1]
                return (
                  <text
                    x={Number(props.x)}
                    y={Number(props.y)}
                    dy={4}
                    textAnchor="end"
                    className={
                      row && filters.categories?.includes(row.category)
                        ? 'cursor-pointer fill-foreground font-semibold'
                        : 'cursor-pointer fill-muted-foreground hover:fill-foreground'
                    }
                    data-testid="breakdown-label"
                    onClick={() => row && toggle(row.category)}
                  >
                    {props.payload?.value}
                  </text>
                )
              }}
            />
            <ChartTooltip cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }} content={<BreakdownTooltip />} />
            {CONFIDENCES.map((c: Confidence, i) => (
              <Bar
                key={c}
                dataKey={c}
                name={`${CONFIDENCE_LABEL[c]} confidence`}
                stackId="confidence"
                fill={`var(--color-${c})`}
                stroke={c === 'low' ? 'var(--conf-low-stroke)' : undefined}
                strokeWidth={c === 'low' ? 1 : 0}
                radius={i === CONFIDENCES.length - 1 ? [0, 4, 4, 0] : 0}
                isAnimationActive={false}
                onClick={(_, index) => {
                  const row = rows[index]
                  if (row) toggle(row.category)
                }}
              >
                {rows.map((r) => (
                  <Cell key={r.category} fillOpacity={highlighted(r.category) ? 1 : 0.3} strokeOpacity={highlighted(r.category) ? 1 : 0.3} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" aria-label="Legend" title={CONFIDENCE_TOOLTIP}>
        {CONFIDENCES.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border" style={{ backgroundColor: `var(--conf-${c})`, borderColor: c === 'low' ? 'var(--conf-low-stroke)' : 'transparent' }} />
            {CONFIDENCE_LABEL[c]} confidence
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Present claims in the latest crawl. Category filter highlights; it doesn&apos;t hide.</p>
    </section>
  )
}
