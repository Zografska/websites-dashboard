import { useMemo, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { confidenceCounts, getLatestCrawl, getNewestCrawl, presentClaims } from '@/lib/derive'
import { useLocale, useT } from '@/i18n/context'
import { formatDateWithStatus, hostname } from '@/lib/format'
import { clampPage, PAGE_SIZE, pageCount, pageList, searchFirms } from '@/lib/home'
import type { Firm } from '@/lib/types'
import { ConfidenceCounters } from './ConfidenceCounters'

const WIDE = 'hidden tab:table-cell' // columns hidden below 700px

export function FirmTable({ firms }: { firms: readonly Firm[] }) {
  const t = useT()
  const { locale } = useLocale()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const q = params.get('q') ?? ''

  const matches = useMemo(() => searchFirms(firms, q), [firms, q])
  const count = pageCount(matches.length)
  const page = clampPage(params.get('page'), count)
  const rows = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const linkState = { homeSearch: location.search }

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    next.delete('page')
    setParams(next, { replace: true })
  }

  const pageSearch = (p: number) => {
    const next = new URLSearchParams(params)
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    const s = next.toString()
    return s ? `?${s}` : ''
  }
  const goToPage = (p: number) => (e: MouseEvent) => {
    e.preventDefault()
    navigate({ search: pageSearch(p) }, { replace: true })
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder={t.home.search}
        aria-label={t.home.search}
        value={q}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.home.col.id}</TableHead>
            <TableHead className={WIDE}>{t.home.col.name}</TableHead>
            <TableHead className={WIDE}>{t.home.col.website}</TableHead>
            <TableHead className="text-right">{t.home.col.claims}</TableHead>
            <TableHead>{t.home.col.confidence}</TableHead>
            <TableHead className={`${WIDE} text-right`}>{t.home.col.crawls}</TableHead>
            <TableHead className={WIDE}>{t.home.col.lastCrawled}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {t.home.noMatch(q)}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((firm) => {
              const newest = getNewestCrawl(firm)
              const hasLatest = getLatestCrawl(firm) !== null
              return (
                <TableRow
                  key={firm.firm_id}
                  data-testid="firm-row"
                  className="cursor-pointer"
                  onClick={() => navigate(`/firm/${firm.firm_id}`, { state: linkState })}
                >
                  <TableCell className="font-mono font-medium">
                    <Link
                      to={`/firm/${firm.firm_id}`}
                      state={linkState}
                      onClick={(e) => e.stopPropagation()}
                      className="underline-offset-4 hover:underline"
                    >
                      {firm.firm_id}
                    </Link>
                  </TableCell>
                  <TableCell className={WIDE}>{firm.firm_name}</TableCell>
                  <TableCell className={WIDE}>
                    <a
                      href={firm.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {hostname(firm.website)}
                    </a>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{hasLatest ? presentClaims(firm).length : '—'}</TableCell>
                  <TableCell>
                    <ConfidenceCounters counts={confidenceCounts(firm)} />
                  </TableCell>
                  <TableCell className={`${WIDE} text-right tabular-nums`}>{firm.crawls.length}</TableCell>
                  <TableCell className={`${WIDE} whitespace-nowrap`}>{formatDateWithStatus(newest.crawled_at, newest.status, locale)}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {matches.length > 0 && (
        <div className="flex flex-col items-center gap-3 tab:flex-row tab:justify-between">
          <p className="text-sm text-muted-foreground" data-testid="showing">
            {t.home.showing((page - 1) * PAGE_SIZE + 1, (page - 1) * PAGE_SIZE + rows.length, matches.length)}
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text={t.home.previous}
                  aria-label={t.home.previousPage}
                  href={page > 1 ? `#/${pageSearch(page - 1)}` : undefined}
                  onClick={page > 1 ? goToPage(page - 1) : undefined}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
              {pageList(page, count).map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href={`#/${pageSearch(p)}`} isActive={p === page} onClick={goToPage(p)}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  text={t.home.next}
                  aria-label={t.home.nextPage}
                  href={page < count ? `#/${pageSearch(page + 1)}` : undefined}
                  onClick={page < count ? goToPage(page + 1) : undefined}
                  aria-disabled={page === count}
                  className={page === count ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
