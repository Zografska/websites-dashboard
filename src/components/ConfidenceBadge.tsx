import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n/context'
import type { Confidence } from '@/lib/types'
import { confidenceFill } from './confidenceStyle'

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const t = useT()
  const label = t.confidence.label[level]
  return (
    <Badge
      data-testid="confidence-badge"
      data-confidence={level}
      title={t.confidence.tooltip}
      aria-label={t.confidence.named(label)}
      className="border"
      style={confidenceFill(level)}
    >
      {label}
    </Badge>
  )
}
