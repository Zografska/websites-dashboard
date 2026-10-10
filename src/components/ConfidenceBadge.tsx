import { Badge } from '@/components/ui/badge'
import { CONFIDENCE_LABEL, CONFIDENCE_TOOLTIP } from '@/lib/format'
import type { Confidence } from '@/lib/types'
import { confidenceFill } from './confidenceStyle'

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <Badge
      data-testid="confidence-badge"
      data-confidence={level}
      title={CONFIDENCE_TOOLTIP}
      aria-label={`${CONFIDENCE_LABEL[level]} confidence`}
      className="border"
      style={confidenceFill(level)}
    >
      {CONFIDENCE_LABEL[level]}
    </Badge>
  )
}
