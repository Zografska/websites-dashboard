import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { categoryLabel } from '@/lib/categories'
import { hasActiveFilters, selectionFromControl } from '@/lib/filters'
import { CONFIDENCE_LABEL, CONFIDENCE_TOOLTIP, SCOPE_LABEL } from '@/lib/format'
import { CONFIDENCES, SCOPES, type Filters } from '@/lib/types'
import { CategoryDot } from './CategoryChip'

// Pressed segments must read clearly as "on".
const ITEM = 'flex-1 px-2 text-xs tab:flex-none tab:px-3 tab:text-sm aria-pressed:bg-primary! aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90! aria-pressed:hover:text-primary-foreground'

type Props = { categories: string[]; filters: Filters; onChange: (f: Filters) => void; onClear: () => void }

export function FilterBar({ categories, filters, onChange, onClear }: Props) {
  const selectedCats = filters.categories ?? categories
  const catSummary =
    filters.categories === null
      ? 'All'
      : filters.categories.length === 1
        ? categoryLabel(filters.categories[0])
        : `${filters.categories.length} selected`

  const toggleCat = (id: string, checked: boolean) => {
    const next = checked ? [...selectedCats, id] : selectedCats.filter((c) => c !== id)
    onChange({ ...filters, categories: selectionFromControl(filters.categories, next, categories) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 tab:flex-row tab:flex-wrap tab:items-center" data-testid="filter-bar">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between tab:w-auto" data-testid="category-filter">
            Category: {catSummary}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {categories.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={selectedCats.includes(id)}
              onCheckedChange={(checked) => toggleCat(id, checked === true)}
              onSelect={(e) => e.preventDefault()} // keep the menu open while toggling
            >
              <CategoryDot category={id} categories={categories} />
              {categoryLabel(id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-sm text-muted-foreground tab:w-auto" title={CONFIDENCE_TOOLTIP}>
          Confidence
        </span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          aria-label="Confidence filter"
          value={filters.confidences ?? [...CONFIDENCES]}
          onValueChange={(v) => onChange({ ...filters, confidences: selectionFromControl(filters.confidences, v, CONFIDENCES) })}
          className="flex-1 tab:flex-none"
        >
          {CONFIDENCES.map((c) => (
            <ToggleGroupItem key={c} value={c} className={ITEM} title={CONFIDENCE_TOOLTIP}>
              {CONFIDENCE_LABEL[c]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-sm text-muted-foreground tab:w-auto">Scope</span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          aria-label="Scope filter"
          value={filters.scopes ?? [...SCOPES]}
          onValueChange={(v) => onChange({ ...filters, scopes: selectionFromControl(filters.scopes, v, SCOPES) })}
          className="flex-1 tab:flex-none"
        >
          {SCOPES.map((s) => (
            <ToggleGroupItem key={s} value={s} className={ITEM}>
              {SCOPE_LABEL[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Button variant="ghost" onClick={onClear} disabled={!hasActiveFilters(filters)} className="w-full tab:ml-auto tab:w-auto">
        Clear filters
      </Button>
    </div>
  )
}
