import type { Locale } from '@/i18n/messages'

export const CATEGORY_LABELS: Record<string, string> = {
  generic_green: 'Generic green',
  certification: 'Certification',
  recycled_recyclable: 'Recycled / recyclable',
  vague_supply_chain: 'Vague supply chain',
  named_endorsement: 'Named endorsement',
  brand_eco_slogan: 'Brand eco-slogan',
  risk_reduction: 'Risk reduction',
}

const CATEGORY_LABELS_IT: Record<string, string> = {
  generic_green: 'Green generico',
  certification: 'Certificazione',
  recycled_recyclable: 'Riciclato / riciclabile',
  vague_supply_chain: 'Filiera vaga',
  named_endorsement: 'Avallo di un ente',
  brand_eco_slogan: 'Slogan eco del marchio',
  risk_reduction: 'Riduzione del rischio',
}

/** Known label, or `snake_case` → `Snake case` for categories the app doesn't know (D7). */
export function categoryLabel(id: string, locale: Locale = 'en'): string {
  const labels = locale === 'it' ? CATEGORY_LABELS_IT : CATEGORY_LABELS
  if (Object.hasOwn(labels, id)) return labels[id]
  const spaced = id.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Colors are assigned by index in `data.categories`; index ≥ 7 gets the fallback. */
export function categoryColorVar(id: string, categories: readonly string[]): string {
  const i = categories.indexOf(id)
  return i >= 0 && i < 7 ? `var(--cat-${i + 1})` : 'var(--cat-fallback)'
}
