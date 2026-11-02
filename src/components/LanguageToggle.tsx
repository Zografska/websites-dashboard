import { useId } from 'react'
import { useLocale, useT } from '@/i18n/context'
import type { Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'

// Inline SVG, not emoji: Windows has no flag emoji and would show "GB" / "IT".
function UkFlag() {
  const id = `uk${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="size-full">
      <clipPath id={`${id}t`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}t)`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

function ItFlag() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" className="size-full">
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  )
}

// Each option is named in its own language, so it's findable by someone who can't read the other.
const OPTIONS: { locale: Locale; name: string; Flag: () => React.JSX.Element }[] = [
  { locale: 'en', name: 'English', Flag: UkFlag },
  { locale: 'it', name: 'Italiano', Flag: ItFlag },
]

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const t = useT()
  return (
    <div role="group" aria-label={t.nav.language} className="inline-flex shrink-0 items-center rounded-full border bg-muted p-0.5" data-testid="language-toggle">
      {OPTIONS.map(({ locale: l, name, Flag }) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-label={name}
            title={name}
            aria-pressed={active}
            onClick={() => setLocale(l)}
            className={cn(
              'rounded-full p-1 transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              active ? 'bg-background shadow-sm' : 'opacity-60 saturate-50 hover:opacity-100 hover:saturate-100',
            )}
          >
            <span className="block size-5 overflow-hidden rounded-full ring-1 ring-foreground/15">
              <Flag />
            </span>
          </button>
        )
      })}
    </div>
  )
}
