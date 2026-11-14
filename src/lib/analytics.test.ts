import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HEARTBEAT_MS } from './activeClock'
import { allowlistProperties, COMMON_PROPS, createAnalytics, EVENT_PROPS, HIDDEN_END_MS, subjectOf, type PostHogLike } from './analytics'
import { claimSuffix } from './claimId'
import { CONSENT_KEY, getStoredConsent, POLICY_V, resetConsentCache } from './consent'
import { dataFile, f006 } from './testData'

type Sent = { event: string; properties: Record<string, unknown>; transport?: string }

const SUBJECT = { subject_id: 'ABCDEFGH2345', is_test: false }

function setup({ noKey = false, failLoad = false } = {}) {
  const key = noKey ? undefined : 'phc_test'
  const sent: Sent[] = []
  const ph: PostHogLike = {
    capture: (event, properties, options) => sent.push({ event, properties, transport: options?.transport }),
  }
  const load = vi.fn(() => (failLoad ? Promise.reject(new Error('blocked')) : Promise.resolve(ph)))
  let n = 0
  const a = createAnalytics({ key, appVersion: 'abc1234', load, uuid: () => `visit-${++n}` })
  return { a, sent, load, names: () => sent.map((s) => s.event) }
}

/** Lets the (already resolved) loader promise settle. */
const loaded = () => vi.advanceTimersByTimeAsync(0)

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

/** Advances time one second at a time, with a keypress each second so the visitor stays active. */
async function activeFor(ms: number) {
  for (let t = 0; t < ms; t += 1000) {
    window.dispatchEvent(new Event('keydown'))
    await vi.advanceTimersByTimeAsync(1000)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  resetConsentCache()
  setVisibility('visible')
  vi.clearAllTimers() // last: instances from earlier tests still listen for visibility changes
})
afterEach(() => {
  vi.useRealTimers()
})

describe('claimSuffix', () => {
  it('keeps only the 6-hex suffix', () => {
    expect(claimSuffix('F012-a1b2c3')).toBe('a1b2c3')
    expect(claimSuffix('ACME-IT_01-0f9e8d')).toBe('0f9e8d')
  })
  it('never falls back to the full ID', () => {
    expect(claimSuffix('F012')).toBe('unknown')
    expect(claimSuffix('F012-nothex')).toBe('unknown')
  })
})

describe('allowlistProperties', () => {
  const base = { token: 'phc_x', distinct_id: 'device-id', $lib: 'web', $lib_version: '1.0.0', $process_person_profile: false }

  it('removes URLs, referrers, initial_* and any unknown key', () => {
    const out = allowlistProperties({
      uuid: 'u1',
      event: 'tab_viewed',
      properties: {
        ...base,
        tab: 'claims',
        trigger: 'click',
        visit_id: 'v1',
        seq: 3,
        $current_url: 'https://greenclaims.2d4d.eu/#/firm/F012?tab=claims',
        $pathname: '/',
        $referrer: 'https://mail.example.com',
        $referring_domain: 'mail.example.com',
        $initial_referrer: 'x',
        $initial_current_url: 'x',
        $host: 'greenclaims.2d4d.eu',
        $session_id: 's',
        $device_id: 'd',
        $browser: 'Chrome',
        $screen_width: 1280,
        firm_id: 'F012',
        text: 'claim text',
      },
      $set: { email: 'x' },
      $set_once: { $initial_current_url: 'x' },
    })
    expect(out).toEqual({
      uuid: 'u1',
      event: 'tab_viewed',
      properties: {
        token: 'phc_x',
        $lib: 'web',
        $lib_version: '1.0.0',
        $process_person_profile: false,
        tab: 'claims',
        trigger: 'click',
        visit_id: 'v1',
        seq: 3,
        distinct_id: 'v1', // pinned to the visit
        $geoip_disable: true,
      },
    })
  })

  it("keeps an event's own properties only on that event", () => {
    const out = allowlistProperties({ uuid: 'u', event: 'website_clicked', properties: { ...base, claim: 'a1b2c3', area: 'generic' } })
    expect(Object.keys(out!.properties)).not.toContain('claim')
    expect(Object.keys(out!.properties)).not.toContain('area')
  })

  it('drops non-primitive values', () => {
    const out = allowlistProperties({ uuid: 'u', event: 'area_selected', properties: { ...base, area: { nested: 'https://x' } } })
    expect(out!.properties).not.toHaveProperty('area')
  })

  it('drops events that are not in the catalogue', () => {
    for (const event of ['$pageview', '$autocapture', '$opt_in', '$identify', 'toString', 'something_else']) {
      expect(allowlistProperties({ uuid: 'u', event, properties: { ...base } })).toBeNull()
    }
    expect(allowlistProperties(null)).toBeNull()
  })

  it('keeps the timestamp', () => {
    const timestamp = new Date('2026-11-14T10:00:00Z')
    expect(allowlistProperties({ uuid: 'u', event: 'locked', properties: base, timestamp })!.timestamp).toBe(timestamp)
  })
})

describe('subjectOf', () => {
  it('needs exactly one firm with a subject_id', () => {
    expect(subjectOf(dataFile())).toBeNull()
    expect(subjectOf(dataFile([f006()]))).toBeNull()
    expect(subjectOf(dataFile([{ ...f006(), subject_id: 'ABCDEFGH2345' }]))).toEqual(SUBJECT)
    expect(subjectOf(dataFile([{ ...f006(), subject_id: 'ABCDEFGH2345', is_test: true }]))).toEqual({ ...SUBJECT, is_test: true })
  })
})

describe('when tracking starts', () => {
  it('does nothing without a key: posthog-js is never loaded', async () => {
    const { a, sent, load } = setup({ noKey: true })
    a.setConsent('granted', 'banner')
    a.setSubject(SUBJECT)
    a.track('website_clicked')
    await activeFor(20_000)
    expect(load).not.toHaveBeenCalled()
    expect(sent).toEqual([])
    expect(a.active).toBe(false)
  })

  it('sends nothing before consent', async () => {
    const { a, sent, load } = setup()
    a.setSubject(SUBJECT)
    a.setTab('overview')
    a.track('website_clicked')
    await activeFor(20_000)
    expect(load).not.toHaveBeenCalled()
    expect(sent).toEqual([])
  })

  it('sends nothing before unlock, even with consent', async () => {
    const { a, sent, load } = setup()
    a.setConsent('granted', 'banner')
    a.setMethodology(true)
    await activeFor(20_000)
    expect(load).not.toHaveBeenCalled()
    expect(sent).toEqual([])
  })

  it('sends nothing after a decline', async () => {
    const { a, sent, load } = setup()
    a.setSubject(SUBJECT)
    a.setConsent('denied', 'banner')
    a.track('website_clicked')
    await activeFor(20_000)
    expect(load).not.toHaveBeenCalled()
    expect(sent).toEqual([])
  })

  it('unlock then accept: consent_granted first, then visit_started and what is on screen', async () => {
    const { a, sent, names } = setup()
    a.setLocale('it')
    a.setSubject(SUBJECT, 'typed')
    a.setTab('claims')
    a.claimOpened({ claim: 'a1b2c3', from: 'deeplink', area: 'generic', light: 'red' })
    a.setConsent('granted', 'banner')
    await loaded()
    expect(names()).toEqual(['consent_granted', 'visit_started', 'tab_viewed', 'claim_opened'])
    expect(sent[0].properties).toMatchObject({ policy_v: POLICY_V, where: 'banner' })
    expect(sent[1].properties).toEqual({
      entry_tab: 'claims',
      deeplink_claim: true,
      unlock: 'typed',
      subject_id: 'ABCDEFGH2345',
      visit_id: 'visit-1',
      seq: 2,
      schema_v: 1,
      app_version: 'abc1234',
      locale: 'it',
      viewport: 'wide',
      is_test: false,
    })
    expect(sent[2].properties).toMatchObject({ tab: 'claims', trigger: 'initial', seq: 3 })
    expect(getStoredConsent()).not.toHaveProperty('unreported')
  })

  it('accept before unlock: consent_granted is held and sent after unlock, also across a reload', async () => {
    const first = setup()
    first.a.setConsent('granted', 'banner')
    expect(getStoredConsent()?.unreported).toBe('banner')
    resetConsentCache() // reload: only localStorage survives

    const { a, names } = setup()
    a.setSubject(SUBJECT, 'typed')
    await loaded()
    expect(names()).toEqual(['consent_granted', 'visit_started'])
  })

  it('a return visit with stored consent sends no consent_granted', async () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice: 'granted', policy_v: POLICY_V, at: new Date().toISOString() }))
    const { a, sent, names } = setup()
    a.setSubject(SUBJECT, 'silent')
    await loaded()
    expect(names()).toEqual(['visit_started'])
    expect(sent[0].properties).toMatchObject({ unlock: 'silent', entry_tab: 'none', deeplink_claim: false })
  })

  it('every event carries exactly the common properties plus its own', async () => {
    const { a, sent } = setup()
    a.setSubject(SUBJECT)
    a.setConsent('granted', 'banner')
    a.setTab('overview', 'click')
    a.track('area_selected', { area: 'labels' })
    a.track('example_stepped', { area: 'labels', direction: 'next', index: 2 })
    a.track('see_all_clicked', { area: 'labels' })
    a.claimOpened({ claim: 'a1b2c3', from: 'table', area: 'labels', light: 'yellow' })
    a.track('source_clicked', { claim: 'a1b2c3', from: 'drawer' })
    a.claimClosed()
    a.track('website_clicked')
    a.track('filter_changed', { filter: 'light', n_selected: 1 })
    a.track('filters_cleared')
    a.setMethodology(true)
    a.track('language_changed', { to: 'it' })
    a.locked()
    await loaded()
    for (const { event, properties } of sent) {
      const expected = [...COMMON_PROPS, ...(EVENT_PROPS as Record<string, readonly string[]>)[event]].sort()
      expect(Object.keys(properties).sort(), event).toEqual(expected)
    }
    expect(sent.map((s) => s.properties.seq)).toEqual(sent.map((_, i) => i + 1))
  })

  it('gives up quietly when posthog-js cannot be loaded', async () => {
    const { a, sent, load } = setup({ failLoad: true })
    a.setSubject(SUBJECT)
    a.setConsent('granted', 'banner')
    await loaded()
    a.track('website_clicked')
    await activeFor(20_000)
    expect(load).toHaveBeenCalledTimes(1)
    expect(sent).toEqual([])
    expect(a.active).toBe(false)
  })
})

describe('active time', () => {
  async function started() {
    const s = setup()
    s.a.setSubject(SUBJECT)
    s.a.setConsent('granted', 'banner')
    s.a.setTab('overview')
    await loaded()
    s.sent.length = 0
    return s
  }
  const heartbeats = (sent: Sent[]) => sent.filter((s) => s.event === 'heartbeat')

  it('sends a heartbeat after 15 s of active time', async () => {
    const { sent } = await started()
    await activeFor(14_000)
    expect(heartbeats(sent)).toHaveLength(0)
    await activeFor(1_000)
    expect(heartbeats(sent)).toHaveLength(1)
    expect(heartbeats(sent)[0].properties).toMatchObject({ active_ms: HEARTBEAT_MS, tab: 'overview', drawer_open: false })
    await activeFor(30_000)
    expect(heartbeats(sent)).toHaveLength(3)
  })

  it('stops counting after 60 s without interaction', async () => {
    const { sent } = await started()
    await vi.advanceTimersByTimeAsync(10 * 60_000) // no interaction at all
    const total = heartbeats(sent).reduce((n, h) => n + (h.properties.active_ms as number), 0)
    expect(total).toBe(60_000)
  })

  it('counts nothing while the tab is hidden, and flushes the partial count on hide', async () => {
    const { sent } = await started()
    await activeFor(7_000)
    setVisibility('hidden')
    expect(heartbeats(sent)).toHaveLength(1)
    expect(heartbeats(sent)[0]).toMatchObject({ transport: 'sendBeacon', properties: { active_ms: 7_000 } })
    await activeFor(60_000)
    expect(heartbeats(sent)).toHaveLength(1)
    setVisibility('visible')
    await activeFor(15_000)
    expect(heartbeats(sent)).toHaveLength(2)
  })

  it('reports how long the drawer was open, in active time', async () => {
    const { a, sent } = await started()
    await activeFor(5_000)
    a.claimOpened({ claim: 'a1b2c3', from: 'table', area: 'generic', light: 'red' })
    await activeFor(4_000)
    a.claimClosed()
    expect(sent.at(-1)).toMatchObject({ event: 'claim_closed', properties: { claim: 'a1b2c3', open_active_ms: 4_000 } })
  })

  it('pagehide sends the last heartbeat and visit_ended by beacon', async () => {
    const { a, sent, names } = await started()
    await activeFor(20_000)
    window.dispatchEvent(new Event('pagehide'))
    expect(names()).toEqual(['heartbeat', 'heartbeat', 'visit_ended'])
    expect(sent[2]).toMatchObject({ transport: 'sendBeacon', properties: { total_active_ms: 20_000, n_events: sent[2].properties.seq as number - 1 } })
    expect(a.active).toBe(false)
    a.track('website_clicked')
    await activeFor(20_000)
    expect(names()).toHaveLength(3)
  })

  it('a tab hidden for 30 minutes ends the visit; coming back starts a new one', async () => {
    const { sent, names } = await started()
    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(HIDDEN_END_MS)
    expect(names()).toEqual(['visit_ended'])
    setVisibility('visible')
    expect(names()).toEqual(['visit_ended', 'visit_started', 'tab_viewed'])
    expect(sent[1].properties).toMatchObject({ visit_id: 'visit-2', seq: 1, unlock: 'silent' })
  })

  it('a short hide does not end the visit', async () => {
    const { names } = await started()
    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(HIDDEN_END_MS - 1000)
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(HIDDEN_END_MS)
    expect(names()).not.toContain('visit_ended')
  })

  it('no timers run before tracking starts or after it stops', async () => {
    const { a } = setup()
    a.setSubject(SUBJECT)
    expect(vi.getTimerCount()).toBe(0)
    a.setConsent('granted', 'banner')
    await loaded()
    expect(vi.getTimerCount()).toBe(1)
    a.setConsent('denied', 'privacy_page')
    await loaded() // jsdom delivers its own `storage` event on a 0 ms timer
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('withdrawing and locking', () => {
  it('withdrawal sends consent_changed last, then nothing', async () => {
    const { a, sent, names } = setup()
    a.setSubject(SUBJECT)
    a.setConsent('granted', 'banner')
    await loaded()
    await activeFor(3_000)
    a.setConsent('denied', 'privacy_page')
    expect(names().slice(-2)).toEqual(['heartbeat', 'consent_changed'])
    expect(sent.at(-1)!.properties).toMatchObject({ to: 'denied' })
    const n = sent.length
    a.track('website_clicked')
    a.setTab('claims', 'click')
    await activeFor(30_000)
    window.dispatchEvent(new Event('pagehide'))
    expect(sent).toHaveLength(n)
    expect(getStoredConsent()?.choice).toBe('denied')
  })

  it('accepting again on the privacy page restarts tracking', async () => {
    const { a, names } = setup()
    a.setSubject(SUBJECT)
    a.setConsent('denied', 'banner')
    a.setConsent('granted', 'privacy_page')
    await loaded()
    expect(names()).toEqual(['consent_granted', 'consent_changed', 'visit_started'])
  })

  it('lock sends locked and stops; a new unlock is a new visit', async () => {
    const { a, sent, names } = setup()
    a.setSubject(SUBJECT, 'typed')
    a.setConsent('granted', 'banner')
    await loaded()
    a.locked()
    a.setSubject(null)
    expect(names().at(-1)).toBe('locked')
    const n = sent.length
    a.track('website_clicked')
    expect(sent).toHaveLength(n)
    a.setSubject(SUBJECT, 'typed')
    expect(sent.at(-1)).toMatchObject({ event: 'visit_started', properties: { visit_id: 'visit-2', unlock: 'typed', seq: 1 } })
  })
})
