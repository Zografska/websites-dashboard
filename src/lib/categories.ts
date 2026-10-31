import type { Locale } from '@/i18n/messages'

export const CATEGORY_LABELS: Record<string, string> = {
  generic_green: 'Generic green',
  undefined_natural: 'Undefined "natural"',
  brand_eco_slogan: 'Brand eco-slogan',
  vague_supply_chain: 'Vague supply chain',
  recycled_recyclable: 'Recycled / recyclable',
  vague_comparison: 'Vague comparison',
  risk_reduction: 'Impact reduction',
  certification: 'Certification',
  named_endorsement: 'Named endorsement',
  climate_neutral: 'Climate neutral',
  future_performance: 'Future performance',
}

const CATEGORY_LABELS_IT: Record<string, string> = {
  generic_green: 'Green generico',
  undefined_natural: '"Naturale" non definito',
  brand_eco_slogan: 'Slogan eco del marchio',
  vague_supply_chain: 'Filiera vaga',
  recycled_recyclable: 'Riciclato / riciclabile',
  vague_comparison: 'Confronto vago',
  risk_reduction: "Riduzione dell'impatto",
  certification: 'Certificazione',
  named_endorsement: 'Avallo di un ente',
  climate_neutral: 'Neutralità climatica',
  future_performance: 'Prestazioni future',
}

/** Known label, or `snake_case` → `Snake case` for categories the app doesn't know (D7). */
export function categoryLabel(id: string, locale: Locale = 'en'): string {
  const labels = locale === 'it' ? CATEGORY_LABELS_IT : CATEGORY_LABELS
  if (Object.hasOwn(labels, id)) return labels[id]
  const spaced = id.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
