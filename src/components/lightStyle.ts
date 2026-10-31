import type { AreaLight } from '@/lib/types'

/** Traffic-light colours (CSS tokens in index.css), never used for detector confidence. */
export const lightColor = (light: AreaLight) => `var(--light-${light})`
export const lightTextColor = (light: AreaLight) => `var(--light-${light}-text)`
