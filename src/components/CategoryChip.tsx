import { Badge } from '@/components/ui/badge'
import { useLocale } from '@/i18n/context'
import { categoryColorVar, categoryLabel } from '@/lib/categories'

export function CategoryDot({ category, categories }: { category: string; categories: readonly string[] }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColorVar(category, categories) }} />
}

export function CategoryChip({ category, categories }: { category: string; categories: readonly string[] }) {
  const { locale } = useLocale()
  return (
    <Badge variant="outline" className="max-w-full gap-1.5" data-testid="category-chip">
      <CategoryDot category={category} categories={categories} />
      <span className="truncate">{categoryLabel(category, locale)}</span>
    </Badge>
  )
}
