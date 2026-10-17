import { cn } from '@/lib/utils'
import { useT } from '@/i18n/context'
import { CONFIDENCES, type Confidence } from '@/lib/types'
import { confidenceFill } from './confidenceStyle'

type Props = { counts: Record<Confidence, number>; variant?: 'compact' | 'tiles' }

/** H/M/L counts of present claims. Always labelled as detector confidence, never risk. */
export function ConfidenceCounters({ counts, variant = 'compact' }: Props) {
  const t = useT()
  const summary = t.confidence.summary(counts)
  if (variant === 'compact') {
    return (
      <span className="inline-flex gap-1" title={t.confidence.tooltip} aria-label={summary} role="group">
        {CONFIDENCES.map((c) => (
          <span
            key={c}
            aria-hidden
            className={cn('inline-flex min-w-9 justify-center rounded border px-1.5 py-0.5 font-mono text-xs tabular-nums', counts[c] === 0 && 'opacity-40')}
            style={confidenceFill(c)}
          >
            {t.confidence.short[c]} {counts[c]}
          </span>
        ))}
      </span>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={summary}>
      {CONFIDENCES.map((c) => (
        <div key={c} data-testid={`counter-${c}`} className="rounded-md border px-3 py-2" style={confidenceFill(c)}>
          <div className="text-xs font-medium">{t.confidence.label[c]}</div>
          <div className="text-2xl font-semibold tabular-nums">{counts[c]}</div>
        </div>
      ))}
    </div>
  )
}
