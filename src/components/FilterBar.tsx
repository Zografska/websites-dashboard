import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useT } from '@/i18n/context'
import { hasActiveFilters, selectionFromControl } from '@/lib/filters'
import { LIGHTS, SCOPES, type Area, type Filters } from '@/lib/types'
import { LightDot } from './Light'

// Pressed segments must read clearly as "on".
const ITEM = 'h-auto min-h-9 flex-1 px-2 py-1 text-xs leading-tight whitespace-normal tab:flex-none tab:whitespace-nowrap tab:px-3 tab:text-sm aria-pressed:bg-primary! aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90! aria-pressed:hover:text-primary-foreground'

type Props = { areas: readonly Area[]; filters: Filters; onChange: (f: Filters) => void; onClear: () => void }

export function FilterBar({ areas, filters, onChange, onClear }: Props) {
  const t = useT()
  const selectedAreas = filters.areas ?? areas
  const areaSummary =
    filters.areas === null ? t.filters.all : filters.areas.length === 1 ? t.areas[filters.areas[0]].title : t.filters.selected(filters.areas.length)

  const toggleArea = (id: Area, checked: boolean) => {
    const next = checked ? [...selectedAreas, id] : selectedAreas.filter((a) => a !== id)
    onChange({ ...filters, areas: selectionFromControl(filters.areas, next, areas) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 tab:flex-row tab:flex-wrap tab:items-center" data-testid="filter-bar">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between tab:w-auto tab:max-w-80" data-testid="area-filter">
            <span className="truncate">
              {t.filters.area}: {areaSummary}
            </span>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {areas.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={selectedAreas.includes(id)}
              onCheckedChange={(checked) => toggleArea(id, checked === true)}
              onSelect={(e) => e.preventDefault()} // keep the menu open while toggling
            >
              {t.areas[id].title}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-sm text-muted-foreground tab:w-auto">{t.light.heading}</span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          aria-label={t.light.filter}
          value={filters.lights ?? [...LIGHTS]}
          onValueChange={(v) => onChange({ ...filters, lights: selectionFromControl(filters.lights, v, LIGHTS) })}
          className="flex-1 tab:flex-none"
        >
          {LIGHTS.map((l) => (
            <ToggleGroupItem key={l} value={l} className={ITEM}>
              <LightDot light={l} />
              {t.light.label[l]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-sm text-muted-foreground tab:w-auto">{t.scope.heading}</span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          aria-label={t.scope.filter}
          value={filters.scopes ?? [...SCOPES]}
          onValueChange={(v) => onChange({ ...filters, scopes: selectionFromControl(filters.scopes, v, SCOPES) })}
          className="flex-1 tab:flex-none"
        >
          {SCOPES.map((s) => (
            <ToggleGroupItem key={s} value={s} className={ITEM}>
              {t.scope.label[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Button variant="ghost" onClick={onClear} disabled={!hasActiveFilters(filters)} className="w-full tab:ml-auto tab:w-auto">
        {t.filters.clear}
      </Button>
    </div>
  )
}
