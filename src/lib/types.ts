import type { z } from 'zod'
import type { Claim, Confidence, Crawl, CrawlStatus, DataFile, Firm, Scope } from './schema'

export type Confidence = z.infer<typeof Confidence>
export type Scope = z.infer<typeof Scope>
export type CrawlStatus = z.infer<typeof CrawlStatus>
export type Crawl = z.infer<typeof Crawl>
export type Claim = z.infer<typeof Claim>
export type Firm = z.infer<typeof Firm>
export type DataFile = z.infer<typeof DataFile>

/** `null` in a dimension means "all". */
export type Filters = {
  categories: string[] | null
  confidences: Confidence[] | null
  scopes: Scope[] | null
}

export const CONFIDENCES: readonly Confidence[] = ['high', 'medium', 'low']
export const SCOPES: readonly Scope[] = ['IN_SCOPE', 'NEEDS_VERIFICATION']
