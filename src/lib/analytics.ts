// Engagement tracking (ANALYTICS_SPEC.md). Every PostHog call in the app goes through this file.
//
// Nothing is loaded or sent until all three hold: a project key is built in (production deploy
// only), the data is unlocked for one firm that has a `subject_id`, and the visitor accepted.
import type { CaptureResult } from 'posthog-js'
import type { Locale } from '@/i18n/messages'
import { ActiveClock } from './activeClock'
import { getConsent, getStoredConsent, markConsentReported, storeConsent, type ConsentChoice, type ConsentWhere } from './consent'
import type { Area, DataFile, Light } from './types'

export const SCHEMA_V = 1
export const POSTHOG_HOST = 'https://eu.i.posthog.com'
/** A tab hidden for this long ends the visit. */
export const HIDDEN_END_MS = 30 * 60_000

export type FirmTab = 'overview' | 'claims' | 'how'
type ClaimFrom = 'table' | 'overview' | 'deeplink'

/** The event catalogue (§6.2). Adding an event, a property or an enum value is a schema change (A11). */
export type EventMap = {
  visit_started: { entry_tab: FirmTab | 'none'; deeplink_claim: boolean; unlock: 'typed' | 'silent' }
  tab_viewed: { tab: FirmTab; trigger: 'initial' | 'click' | 'see_all' }
  area_selected: { area: Area }
  example_stepped: { area: Area; direction: 'prev' | 'next'; index: number }
  see_all_clicked: { area: Area }
  claim_opened: { claim: string; from: ClaimFrom; area: Area; light: Light }
  claim_closed: { claim: string; open_active_ms: number }
  source_clicked: { claim: string; from: 'table' | 'drawer' | 'overview' }
  website_clicked: Record<never, never>
  filter_changed: { filter: 'area' | 'light' | 'scope'; n_selected: number }
  filters_cleared: Record<never, never>
  methodology_viewed: Record<never, never>
  language_changed: { to: Locale }
  heartbeat: { tab: FirmTab | 'none'; drawer_open: boolean; active_ms: number }
  visit_ended: { total_active_ms: number; n_events: number }
  locked: Record<never, never>
  consent_granted: { policy_v: number; where: ConsentWhere }
  consent_changed: { to: ConsentChoice }
}
export type EventName = keyof EventMap

/** Events the UI sends directly. The rest are produced inside this module. */
export type UiEvent =
  | 'area_selected'
  | 'example_stepped'
  | 'see_all_clicked'
  | 'source_clicked'
  | 'website_clicked'
  | 'filter_changed'
  | 'filters_cleared'
  | 'language_changed'

/** Runtime copy of the catalogue: the properties each event may carry. */
export const EVENT_PROPS: { readonly [E in EventName]: readonly (keyof EventMap[E])[] } = {
  visit_started: ['entry_tab', 'deeplink_claim', 'unlock'],
  tab_viewed: ['tab', 'trigger'],
  area_selected: ['area'],
  example_stepped: ['area', 'direction', 'index'],
  see_all_clicked: ['area'],
  claim_opened: ['claim', 'from', 'area', 'light'],
  claim_closed: ['claim', 'open_active_ms'],
  source_clicked: ['claim', 'from'],
  website_clicked: [],
  filter_changed: ['filter', 'n_selected'],
  filters_cleared: [],
  methodology_viewed: [],
  language_changed: ['to'],
  heartbeat: ['tab', 'drawer_open', 'active_ms'],
  visit_ended: ['total_active_ms', 'n_events'],
  locked: [],
  consent_granted: ['policy_v', 'where'],
  consent_changed: ['to'],
}

/** On every event (§6.1). */
export const COMMON_PROPS = ['subject_id', 'visit_id', 'seq', 'schema_v', 'app_version', 'locale', 'viewport', 'is_test'] as const

// What PostHog needs to ingest an event. `$process_person_profile` carries `person_profiles:
// 'never'` to the server; without it PostHog would create a person record per visit.
const INTERNAL_PROPS = ['token', 'distinct_id', '$lib', '$lib_version', '$time', '$process_person_profile'] as const

/**
 * The `before_send` hook (A7): drops every event not in the catalogue and every property not on
 * the allowlist, so `$current_url`, `$pathname`, `$referrer`, `$initial_*`, device and session
 * properties never leave the browser. Also pins `distinct_id` to the visit and turns off
 * server-side GeoIP lookup.
 */
export function allowlistProperties(cr: CaptureResult | null): CaptureResult | null {
  if (!cr || !Object.hasOwn(EVENT_PROPS, cr.event)) return null
  const keep = new Set<string>([...COMMON_PROPS, ...INTERNAL_PROPS, ...(EVENT_PROPS[cr.event as EventName] as readonly string[])])
  const properties: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(cr.properties ?? {})) {
    if (!keep.has(key)) continue
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue
    properties[key] = value
  }
  // No ID outlives the page load on PostHog's side (§6.1).
  if (typeof properties.visit_id === 'string') properties.distinct_id = properties.visit_id
  // Without this PostHog derives country/city from the request IP before discarding it.
  properties.$geoip_disable = true
  // A fresh object: `$set`, `$set_once` and `$unset` are left behind.
  return { uuid: cr.uuid, event: cr.event, properties, ...(cr.timestamp ? { timestamp: cr.timestamp } : {}) }
}

export type Subject = { subject_id: string; is_test: boolean }

/** The subject every event carries in test mode when the data has none of its own. */
export const TEST_SUBJECT_ID = 'TESTMODE'

/**
 * The firm the unlocked data stands for, or `null`. Tracking needs the data to hold exactly one
 * firm with a `subject_id` (per-firm access, §3); a file with several firms is never tracked.
 *
 * In test mode any file is tracked, under a fixed test subject if it has none, and always
 * flagged `is_test`.
 */
export function subjectOf(data: DataFile, testMode = false): Subject | null {
  const firm = data.firms.length === 1 ? data.firms[0] : undefined
  if (firm?.subject_id) return { subject_id: firm.subject_id, is_test: testMode || firm.is_test === true }
  return testMode ? { subject_id: TEST_SUBJECT_ID, is_test: true } : null
}

type CaptureOptions = { timestamp: Date; transport?: 'sendBeacon' }
export type PostHogLike = { capture: (event: string, properties: Record<string, unknown>, options?: CaptureOptions) => unknown }

/** Downloads and starts `posthog-js`. Only ever called after unlock and consent (A4, A5). */
export async function loadPosthog(key: string, visitId: string): Promise<PostHogLike> {
  const { default: posthog } = await import('posthog-js')
  posthog.init(key, {
    api_host: POSTHOG_HOST,
    persistence: 'memory', // no cookies, no localStorage
    person_profiles: 'never', // events only, no person records
    bootstrap: { distinctID: visitId },
    autocapture: false,
    capture_pageview: false, // we send our own events
    capture_pageleave: false,
    capture_exceptions: false,
    capture_performance: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    rageclick: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true, // no /flags call and no remote config
    save_referrer: false,
    save_campaign_params: false,
    before_send: allowlistProperties,
  })
  return posthog
}

type Deps = {
  /** The project key. Without one, nothing in this module does anything (A10). */
  key: string | undefined
  appVersion: string
  load: (key: string, visitId: string) => Promise<PostHogLike>
  /** Test mode: every event is flagged `is_test`, whatever the subject says. */
  testMode?: boolean
  now?: () => number
  uuid?: () => string
}

type OpenClaim = EventMap['claim_opened'] & { openedAt: number }
type Queued = { event: EventName; properties: Record<string, unknown>; options: CaptureOptions }

export function createAnalytics(deps: Deps) {
  const now = deps.now ?? Date.now
  const uuid = deps.uuid ?? (() => globalThis.crypto.randomUUID())

  let subject: Subject | null = null
  let unlock: 'typed' | 'silent' = 'typed'
  let locale: Locale = 'en'
  // What is on screen. Kept even while tracking is off, so a visit that starts late (consent
  // given after the page rendered) still reports the open tab and drawer.
  let tab: FirmTab | null = null
  let claim: OpenClaim | null = null
  let methodology = false

  let visit: { id: string; seq: number } | null = null
  /** The visit ended on pagehide or a long hide; a new one starts if the page comes back. */
  let suspended = false
  /** The visitor switched from "declined" to "accepted" on the privacy page. */
  let regranted = false
  let ph: PostHogLike | null = null
  let loading = false
  /** `posthog-js` couldn't be downloaded (blocker, firewall): give up for this page load. */
  let dead = false
  let queue: Queued[] = []
  let beacon = false
  let listening = false
  let hiddenTimer: ReturnType<typeof setTimeout> | null = null

  const clock = new ActiveClock({
    now,
    onHeartbeat: (ms) => send('heartbeat', { tab: tab ?? 'none', drawer_open: claim !== null, active_ms: ms }),
  })

  function viewport(): 'narrow' | 'wide' {
    return typeof window.matchMedia === 'function' && !window.matchMedia('(min-width: 700px)').matches ? 'narrow' : 'wide'
  }

  function send<E extends EventName>(event: E, props: EventMap[E]) {
    if (!visit || !subject) return
    visit.seq += 1
    const item: Queued = {
      event,
      properties: {
        ...props,
        subject_id: subject.subject_id,
        visit_id: visit.id,
        seq: visit.seq,
        schema_v: SCHEMA_V,
        app_version: deps.appVersion,
        locale,
        viewport: viewport(),
        is_test: deps.testMode === true || subject.is_test,
      },
      // Passing options makes posthog-js send each event at once instead of batching it,
      // so nothing waits in a queue when the page goes away.
      options: { timestamp: new Date(now()), ...(beacon ? { transport: 'sendBeacon' as const } : {}) },
    }
    if (ph) ph.capture(item.event, item.properties, item.options)
    else queue.push(item)
  }

  function sendWithBeacon(fn: () => void) {
    beacon = true
    try {
      fn()
    } finally {
      beacon = false
    }
  }

  function ensureLoaded(key: string, visitId: string) {
    if (ph || loading) return
    loading = true
    deps.load(key, visitId).then(
      (loaded) => {
        loading = false
        ph = loaded
        const pending = queue
        queue = []
        for (const item of pending) loaded.capture(item.event, item.properties, item.options)
      },
      () => {
        loading = false
        dead = true
        queue = []
        endVisit()
      },
    )
  }

  function endVisit() {
    clock.stop()
    visit = null
    if (hiddenTimer !== null) clearTimeout(hiddenTimer)
    hiddenTimer = null
  }

  /** `pagehide`, or hidden for 30 minutes: last heartbeat, then `visit_ended`. */
  function finishVisit() {
    if (!visit) return
    sendWithBeacon(() => {
      clock.flush()
      // n_events counts the events before this one.
      send('visit_ended', { total_active_ms: Math.round(clock.total), n_events: visit?.seq ?? 0 })
    })
    endVisit()
    suspended = true
  }

  function resume() {
    if (!suspended) return
    suspended = false
    evaluate()
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      if (!visit) return
      sendWithBeacon(() => clock.flush())
      if (hiddenTimer === null) hiddenTimer = setTimeout(finishVisit, HIDDEN_END_MS)
    } else {
      if (hiddenTimer !== null) clearTimeout(hiddenTimer)
      hiddenTimer = null
      resume()
    }
  }

  function listen() {
    if (listening) return
    listening = true
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', finishVisit)
    // Back from the back/forward cache: the same page, a new visit.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) resume()
    })
  }

  function begin(key: string) {
    visit = { id: uuid(), seq: 0 }
    ensureLoaded(key, visit.id)
    clock.start()
    listen()

    // Proof of consent (§5.4): the first event after Accept, also when Accept came before unlock.
    const stored = getStoredConsent()
    if (stored?.unreported) {
      send('consent_granted', { policy_v: stored.policy_v, where: stored.unreported })
      markConsentReported()
    }
    if (regranted) send('consent_changed', { to: 'granted' })
    regranted = false

    send('visit_started', { entry_tab: tab ?? 'none', deeplink_claim: claim?.from === 'deeplink', unlock })
    unlock = 'silent' // a later visit in this page load needed no typing
    if (methodology) send('methodology_viewed', {})
    if (tab) send('tab_viewed', { tab, trigger: 'initial' })
    if (claim) {
      claim.openedAt = 0
      send('claim_opened', { claim: claim.claim, from: claim.from, area: claim.area, light: claim.light })
    }
  }

  function evaluate() {
    if (visit || suspended || dead || !deps.key) return
    if (subject && getConsent() === 'granted') begin(deps.key)
  }

  return {
    /** Sends one UI event. Does nothing unless a visit is being tracked. */
    track<E extends UiEvent>(event: E, ...props: keyof EventMap[E] extends never ? [] : [EventMap[E]]) {
      send(event, (props[0] ?? {}) as EventMap[E])
    },

    /** Called when the data unlocks (with the firm it stands for) and when it locks (`null`). */
    setSubject(next: Subject | null, unlockedBy: 'typed' | 'silent' = 'typed') {
      if (next?.subject_id === subject?.subject_id) return
      if (visit) {
        clock.flush()
        endVisit()
      }
      suspended = false
      subject = next
      if (next) unlock = unlockedBy
      evaluate()
    },

    /** Records the visitor's choice and starts or stops tracking accordingly. */
    setConsent(choice: ConsentChoice, where: ConsentWhere) {
      const previous = getConsent()
      if (choice === 'granted') {
        if (previous === 'granted') return
        regranted = previous === 'denied' && where === 'privacy_page'
        storeConsent('granted', where)
        evaluate()
        return
      }
      if (visit) {
        // The last event sent when withdrawing; nothing follows it.
        clock.flush()
        send('consent_changed', { to: 'denied' })
        if (!ph) queue = [] // not even loaded yet: send nothing at all
        endVisit()
      }
      storeConsent('denied')
    },

    setLocale(next: Locale) {
      locale = next
    },

    /** The firm tab on screen, or `null` when leaving the firm page. */
    setTab(next: FirmTab | null, trigger: EventMap['tab_viewed']['trigger'] = 'initial') {
      tab = next
      if (next) send('tab_viewed', { tab: next, trigger })
    },

    /** The methodology page is on screen (`true`) or was left (`false`). */
    setMethodology(open: boolean) {
      if (open && !methodology) send('methodology_viewed', {})
      methodology = open
    },

    claimOpened(info: EventMap['claim_opened']) {
      if (claim) this.claimClosed()
      claim = { ...info, openedAt: visit ? clock.total : 0 }
      send('claim_opened', info)
    },

    claimClosed() {
      if (!claim) return
      send('claim_closed', { claim: claim.claim, open_active_ms: Math.round(clock.total - claim.openedAt) })
      claim = null
    },

    /** The Lock button. Call before the data is locked. */
    locked() {
      if (!visit) return
      clock.flush()
      send('locked', {})
    },

    /** Whether a visit is being tracked right now. */
    get active(): boolean {
      return visit !== null
    },
  }
}

export type Analytics = ReturnType<typeof createAnalytics>

// Production builds only, and only when the deploy job supplied the key.
const KEY = import.meta.env.PROD ? import.meta.env.VITE_POSTHOG_KEY || undefined : undefined

/** Whether this build can track at all. The consent banner and privacy page exist only when it can. */
export const ANALYTICS_ENABLED = KEY !== undefined

/**
 * Test mode, for builds that are not the study site (`VITE_ANALYTICS_TEST=1`, never set in the
 * deploy job). Tracking works with any data file and every event is flagged `is_test`, so
 * nothing sent from such a build can be mistaken for study data.
 */
export const ANALYTICS_TEST_MODE = ANALYTICS_ENABLED && import.meta.env.VITE_ANALYTICS_TEST === '1'

export const analytics = createAnalytics({
  key: KEY,
  testMode: ANALYTICS_TEST_MODE,
  appVersion: __APP_VERSION__,
  load: loadPosthog,
})

export const track: Analytics['track'] = (...args) => analytics.track(...args)
