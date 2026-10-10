import type { CSSProperties } from 'react'
import type { Confidence } from '@/lib/types'

const FG: Record<Confidence, string> = {
  high: 'var(--conf-high-fg)',
  medium: 'var(--conf-medium-fg)',
  low: 'var(--conf-low-fg)',
}

/** Filled confidence colors (D4). Low gets a darker outline: yellow on white is too faint alone. */
export function confidenceFill(level: Confidence): CSSProperties {
  return {
    backgroundColor: `var(--conf-${level})`,
    color: FG[level],
    borderColor: level === 'low' ? 'var(--conf-low-stroke)' : 'transparent',
  }
}
