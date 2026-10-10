import { cn } from '@/lib/utils'
import { CONFIDENCE_LABEL, CONFIDENCE_TOOLTIP } from '@/lib/format'
import { CONFIDENCES, type Confidence } from '@/lib/types'
import { confidenceFill } from './confidenceStyle'

type Props = { counts: Record<Confidence, number>; variant?: 'compact' | 'tiles' }

const SHORT: Record<Confidence, string> = { high: 'H', medium: 'M', low: 'L' }

/** H/M/L counts of present claims. Always labelled as detector confidence, never risk. */
export function ConfidenceCounters({ counts, variant = 'compact' }: Props) {
  const summary = `Confidence: ${CONFIDENCES.map((c) => `${counts[c]} ${c}`).join(', ')}`
  if (variant === 'compact') {
    return (
      <span className="inline-flex gap-1" title={CONFIDENCE_TOOLTIP} aria-label={summary} role="group">
        {CONFIDENCES.map((c) => (
          <span
            key={c}
            aria-hidden
            className={cn('inline-flex min-w-9 justify-center rounded border px-1.5 py-0.5 font-mono text-xs tabular-nums', counts[c] === 0 && 'opacity-40')}
            style={confidenceFill(c)}
          >
            {SHORT[c]} {counts[c]}
          </span>
        ))}
      </span>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={summary}>
      {CONFIDENCES.map((c) => (
        <div key={c} data-testid={`counter-${c}`} className="rounded-md border px-3 py-2" style={confidenceFill(c)}>
          <div className="text-xs font-medium">{CONFIDENCE_LABEL[c]}</div>
          <div className="text-2xl font-semibold tabular-nums">{counts[c]}</div>
        </div>
      ))}
    </div>
  )
}
