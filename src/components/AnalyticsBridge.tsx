import { useEffect } from 'react'
import { useDataState } from '@/data/context'
import { useLocale } from '@/i18n/context'
import { analytics, subjectOf } from '@/lib/analytics'

/**
 * Tells the analytics module which firm is unlocked and which language is shown.
 * Rendered after the pages, so their effects (open tab, open drawer) have already run when a
 * visit starts.
 */
export function AnalyticsBridge() {
  const { state } = useDataState()
  const { locale } = useLocale()
  const subject = state.status === 'ready' ? subjectOf(state.data) : null
  const subjectId = subject?.subject_id ?? null
  const isTest = subject?.is_test ?? false
  const unlockedBy = state.status === 'ready' ? state.unlockedBy : 'typed'

  useEffect(() => {
    analytics.setLocale(locale)
  }, [locale])

  useEffect(() => {
    analytics.setSubject(subjectId === null ? null : { subject_id: subjectId, is_test: isTest }, unlockedBy)
  }, [subjectId, isTest, unlockedBy])

  return null
}
