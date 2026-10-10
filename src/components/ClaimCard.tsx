import { formatDate } from '@/lib/format'
import type { Claim } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategoryChip } from './CategoryChip'
import { ConfidenceBadge } from './ConfidenceBadge'

type Props = {
  claim: Claim
  categories: readonly string[]
  present: boolean
  lastSeen: string
  onOpen: (claimId: string) => void
}

export function ClaimCard({ claim, categories, present, lastSeen, onOpen }: Props) {
  const nv = claim.scope_status === 'NEEDS_VERIFICATION'
  return (
    <button
      type="button"
      data-testid="claim-card"
      data-claim-id={claim.claim_id}
      data-present={present}
      onClick={() => onOpen(claim.claim_id)}
      className={cn(
        'flex h-[160px] w-[280px] shrink-0 flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        nv && 'border-2 border-dashed border-foreground/40',
        !present && 'opacity-60 grayscale',
      )}
    >
      <p lang="it" className="line-clamp-3 text-sm leading-snug font-medium">
        {claim.text}
      </p>
      <div className="mt-auto space-y-1.5">
        {(nv || !present) && (
          <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {nv && <span>Needs verification</span>}
            {!present && <span>Removed · last seen {formatDate(lastSeen)}</span>}
          </p>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <CategoryChip category={claim.category} categories={categories} />
          </div>
          <ConfidenceBadge level={claim.confidence} />
        </div>
      </div>
    </button>
  )
}
