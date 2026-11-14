import { useEffect } from 'react'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import mdEn from '@/content/METHODOLOGY.md?raw'
import mdIt from '@/content/METHODOLOGY.it.md?raw'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocale, useT } from '@/i18n/context'
import type { Locale } from '@/i18n/messages'
import { analytics } from '@/lib/analytics'
import { cleanMethodology } from '@/lib/methodology'

const CONTENT: Record<Locale, string> = { en: cleanMethodology(mdEn), it: cleanMethodology(mdIt) }

export default function Methodology() {
  const t = useT()
  const { locale } = useLocale()
  useDocumentTitle(t.nav.methodology)
  useEffect(() => {
    analytics.setMethodology(true)
    return () => analytics.setMethodology(false)
  }, [])
  return <MarkdownArticle>{CONTENT[locale]}</MarkdownArticle>
}
