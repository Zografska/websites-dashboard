import { Link } from 'react-router'
import { useLocale, useT } from '@/i18n/context'
import { getLatestCrawl } from '@/lib/derive'
import { formatDate } from '@/lib/format'
import type { AreaLight, Firm } from '@/lib/types'
import { lightTextColor } from './lightStyle'

export function HowToRead({ firm, futureFound }: { firm: Firm; futureFound: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const latest = getLatestCrawl(firm)
  const cards: [AreaLight, string][] = [
    ['red', t.how.redBody],
    ['yellow', t.how.yellowBody],
    ['green', t.how.greenBody],
  ]
  return (
    <div className="space-y-5" data-testid="how-to-read">
      <div className="grid gap-3 tab:grid-cols-3">
        {cards.map(([light, body]) => (
          <section key={light} className="space-y-2 rounded-xl border p-4" data-light={light}>
            <h2 className="font-semibold" style={{ color: lightTextColor(light) }}>
              {t.light.tag[light]}
            </h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">{t.how.rule}</strong> {t.how.ruleBody}
        </p>
        <p>
          <strong className="text-foreground">{t.how.scope}</strong> {latest ? t.how.scopeBody(formatDate(latest.crawled_at, locale)) : t.how.scopeNoDate}
        </p>
        {!futureFound && <p>{t.how.future}</p>}
        <p>
          <Link to="/methodology" className="text-foreground underline underline-offset-4">
            {t.how.methodology} →
          </Link>
        </p>
      </div>
    </div>
  )
}
