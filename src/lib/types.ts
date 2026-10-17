import type { z } from 'zod'
import type { Claim, Confidence, Crawl, CrawlStatus, DataFile, Firm, Scope } from './schema'

export type Confidence = z.infer<typeof Confidence>
export type Scope = z.infer<typeof Scope>
export type CrawlStatus = z.infer<typeof CrawlStatus>
export type Crawl = z.infer<typeof Crawl>
export type Claim = z.infer<typeof Claim>
export type Firm = z.infer<typeof Firm>
export type DataFile = z.infer<typeof DataFile>

/** The PO's five review areas, in display order (PLAN §5.2). */
export const AREAS = ['generic', 'scope', 'evidence', 'labels', 'future'] as const
export type MainArea = (typeof AREAS)[number]
/** `other` holds categories the app doesn't know; it's shown only when non-empty. */
export type Area = MainArea | 'other'
export const ALL_AREAS: readonly Area[] = [...AREAS, 'other']

/** A claim is red or yellow; green only describes an area with nothing found. */
export type Light = 'red' | 'yellow'
export type AreaLight = Light | 'green'
export const LIGHTS: readonly Light[] = ['red', 'yellow']

/** `null` in a dimension means "all". */
export type Filters = {
  areas: Area[] | null
  lights: Light[] | null
  scopes: Scope[] | null
}

export const SCOPES: readonly Scope[] = ['IN_SCOPE', 'NEEDS_VERIFICATION']
