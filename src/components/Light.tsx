import { useT } from '@/i18n/context'
import type { AreaLight } from '@/lib/types'
import { cn } from '@/lib/utils'
import { lightColor } from './lightStyle'

export function LightDot({ light, className }: { light: AreaLight; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ backgroundColor: lightColor(light) }} />
}

/** Dot plus the colour's name, so colour is never the only signal. */
export function LightLabel({ light, className }: { light: AreaLight; className?: string }) {
  const t = useT()
  return (
    <span className={cn('inline-flex items-center gap-2', className)} data-testid="light" data-light={light}>
      <LightDot light={light} />
      {t.light.label[light]}
    </span>
  )
}

/** One segment per main area, in area order. Green areas are drawn grey, as in the PO's mock-up. */
export function AreaBar({ lights, label, size = 'lg' }: { lights: readonly AreaLight[]; label: string; size?: 'sm' | 'lg' }) {
  return (
    <div role="img" aria-label={label} className={cn('flex', size === 'lg' ? 'gap-2' : 'gap-0.5')} data-testid="area-bar">
      {lights.map((l, i) => (
        <span
          key={i}
          data-light={l}
          className={cn('rounded-full', size === 'lg' ? 'h-2 flex-1' : 'h-1.5 w-3')}
          style={{ backgroundColor: l === 'green' ? 'var(--light-none)' : lightColor(l) }}
        />
      ))}
    </div>
  )
}
