import type { Locale } from '@/i18n/messages'
import { cleanMethodology } from '@/lib/methodology'
import mdEn from './PRIVACY.en.md?raw'
import mdIt from './PRIVACY.it.md?raw'

/** The privacy notice, shown on the privacy page and inside the consent banner when expanded. */
export const PRIVACY_NOTICE: Record<Locale, string> = { en: cleanMethodology(mdEn), it: cleanMethodology(mdIt) }
