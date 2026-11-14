// Engagement tracking (ANALYTICS_SPEC §11). The build carries a dummy PostHog key and every
// PostHog request is answered locally by the `posthog` fixture.
import { TEST_SUBJECT_ID, TRACKED_FIRM_ID } from './paths'
import { expect, loadFixture, openUnlocked, test, unlock, type TrackedEvent } from './helpers'

const FIRM = `#/firm/${TRACKED_FIRM_ID}`
const banner = (page: import('@playwright/test').Page) => page.getByTestId('consent-banner')

const COMMON = ['subject_id', 'visit_id', 'seq', 'schema_v', 'app_version', 'locale', 'viewport', 'is_test']
const INTERNAL = ['token', 'distinct_id', '$lib', '$lib_version', '$time', '$process_person_profile', '$geoip_disable']
const OWN: Record<string, string[]> = {
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

/** No payload may carry a URL, a route, the firm ID or name, or claim text. */
function expectClean(events: TrackedEvent[]) {
  const firm = loadFixture().firms.find((f) => f.firm_id === TRACKED_FIRM_ID)!
  const forbidden = ['http', '#/', 'localhost', firm.firm_id, firm.firm_name, new URL(firm.website).host, ...firm.claims.map((c) => c.text)]
  for (const e of events) {
    expect(Object.keys(OWN), `unknown event ${e.event}`).toContain(e.event)
    const allowed = new Set([...COMMON, ...INTERNAL, ...OWN[e.event]])
    expect(Object.keys(e.properties).filter((k) => !allowed.has(k)), `extra properties on ${e.event}`).toEqual([])
    for (const key of COMMON) expect(e.properties, `${e.event} lacks ${key}`).toHaveProperty(key)
    expect(e.properties.distinct_id).toBe(e.properties.visit_id)
    expect(e.properties.$geoip_disable).toBe(true)
    expect(e.properties.$process_person_profile).toBe(false)
    const payload = JSON.stringify(e)
    for (const text of forbidden) expect(payload, `${e.event} leaks "${text}"`).not.toContain(text)
  }
}

test.describe('tracking off', () => {
  test.use({ dataFile: 'tracked' })

  test('consent declined (the default in every other spec): nothing is ever sent', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await expect(banner(page)).toHaveCount(0)
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.getByTestId('claim-row').first().click()
    await expect(page.getByTestId('claim-drawer')).toBeVisible()
    await page.waitForTimeout(4000) // longer than PostHog's batch interval
    expect(posthog.requests).toHaveLength(0)
  })
})

test.describe('consent banner', () => {
  test.use({ consent: 'none', dataFile: 'tracked' })

  test('nothing is sent or downloaded before unlock, nor before consent', async ({ page, posthog }) => {
    const scripts: string[] = []
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url())
    })
    await page.goto(FIRM)
    await expect(banner(page)).toBeVisible()
    await expect(banner(page)).toBeFocused()
    await unlock(page)
    await expect(page.locator('[data-app-state="ready"]')).toBeVisible()
    // Using the page is not consent.
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(4000)
    expect(posthog.requests).toHaveLength(0)
    const before = scripts.length

    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect.poll(posthog.names).toContain('visit_started')
    expect(scripts.length).toBeGreaterThan(before) // posthog-js is fetched only now
  })

  test('Decline: the banner goes, stays gone after a reload, and nothing is sent', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'Continue without measurement', exact: true }).click()
    await expect(banner(page)).toHaveCount(0)
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.reload()
    await expect(page.locator('[data-app-state="ready"]')).toBeVisible()
    await expect(banner(page)).toHaveCount(0)
    await page.waitForTimeout(4000)
    expect(posthog.requests).toHaveLength(0)
  })

  test('× counts as Decline', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'Close (continue without measurement)' }).click()
    await expect(banner(page)).toHaveCount(0)
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fcd.consent')!) as { choice: string; policy_v: number; at: string })
    expect(stored).toMatchObject({ choice: 'denied', policy_v: 1 })
    expect(Object.keys(stored).sort()).toEqual(['at', 'choice', 'policy_v'])
    await page.waitForTimeout(4000)
    expect(posthog.requests).toHaveLength(0)
  })

  test('the report works the same while the banner is open', async ({ page }) => {
    await openUnlocked(page, FIRM)
    await expect(banner(page)).toBeVisible()
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.getByTestId('claim-row').first().click()
    await expect(page.getByTestId('claim-drawer')).toBeVisible()
  })

  test('Accept and Decline look the same', async ({ page }) => {
    await page.goto(FIRM)
    const accept = page.getByRole('button', { name: 'I consent to measurement', exact: true })
    const decline = page.getByRole('button', { name: 'Continue without measurement', exact: true })
    const style = (el: Element) => {
      const s = getComputedStyle(el)
      return [s.width, s.height, s.fontSize, s.fontWeight, s.color, s.backgroundColor, s.borderColor, s.borderWidth].join('|')
    }
    expect(await accept.evaluate(style)).toBe(await decline.evaluate(style))
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`on a 375px phone it stays small and off the passphrase form (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(FIRM)
      const box = (await banner(page).boundingBox())!
      // The project's own short text is longer than the first draft: a third of the screen, not a quarter.
      expect(box.height).toBeLessThanOrEqual(667 / 3)
      expect(box.y + box.height).toBeCloseTo(667, 0)
      for (const target of [page.getByLabel('Passcode'), page.getByRole('button', { name: 'Unlock' })]) {
        const t = (await target.boundingBox())!
        expect(t.y + t.height).toBeLessThanOrEqual(box.y)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    })
  }

  test('"Privacy notice" expands the full notice inside the banner', async ({ page, posthog }) => {
    await page.goto(FIRM)
    const toggle = banner(page).getByRole('button', { name: 'Privacy notice' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('consent-notice')).toHaveCount(0)
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const notice = page.getByTestId('consent-notice')
    await expect(notice.getByRole('heading', { name: 'Privacy and cookie notice for the 2D4D report page' })).toBeVisible()
    await expect(notice).toContainText('privacy@cmcc.it')
    // Reading the notice is not a choice: both buttons are still there and nothing is stored or sent.
    await expect(banner(page).getByRole('button', { name: 'I consent to measurement', exact: true })).toBeVisible()
    await expect(banner(page).getByRole('button', { name: 'Continue without measurement', exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('fcd.consent'))).toBeNull()
    expect(posthog.requests).toHaveLength(0)
    await toggle.click()
    await expect(page.getByTestId('consent-notice')).toHaveCount(0)
  })

  test('Italian text', async ({ page }) => {
    await page.goto(FIRM)
    await page.getByRole('button', { name: 'Italiano' }).click()
    await expect(banner(page)).toContainText('Con il Suo consenso misuriamo')
    await expect(page.getByRole('button', { name: 'Acconsento alla misurazione', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continua senza misurazione', exact: true })).toBeVisible()
    await expect(banner(page).getByRole('button', { name: 'Informativa privacy' })).toBeVisible()
  })
})

test.describe('tracking on', () => {
  test.use({ consent: 'none', dataFile: 'tracked' })

  test.beforeEach(async ({ context }) => {
    // Source and website links open the firm's real site: answer those locally too.
    await context.route(
      (url) => url.hostname !== 'localhost' && !url.hostname.endsWith('posthog.com'),
      (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }),
    )
  })

  test('after Accept: the expected events, and no payload carries a URL, firm ID or claim text', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect(banner(page)).toHaveCount(0)

    await page.getByTestId('area-item').nth(1).click()
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    const row = page.getByTestId('claim-row').first()
    const claimId = (await row.getAttribute('data-claim-id'))!
    await row.click()
    const drawer = page.getByTestId('claim-drawer')
    await expect(drawer).toBeVisible()
    const popup = page.waitForEvent('popup')
    await drawer.locator('a[target="_blank"]').click()
    await (await popup).close()
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(drawer).toHaveCount(0)
    await page.getByRole('button', { name: 'Italiano' }).click()

    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('language_changed')
    const events = posthog.events()
    expect(events.map((e) => e.event)).toEqual([
      'consent_granted',
      'visit_started',
      'tab_viewed',
      'area_selected',
      'tab_viewed',
      'claim_opened',
      'source_clicked',
      'claim_closed',
      'language_changed',
    ])
    expect(events.map((e) => e.properties.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    const suffix = claimId.split('-').pop()
    expect(events[0].properties).toMatchObject({ policy_v: 1, where: 'banner' })
    expect(events[1].properties).toMatchObject({
      entry_tab: 'overview',
      deeplink_claim: false,
      unlock: 'typed',
      subject_id: TEST_SUBJECT_ID,
      schema_v: 1,
      locale: 'en',
      viewport: 'wide',
      is_test: true,
    })
    expect(events[1].properties.app_version).toMatch(/^[0-9a-f]{7}$|^dev$/)
    expect(events[2].properties).toMatchObject({ tab: 'overview', trigger: 'initial' })
    expect(events[4].properties).toMatchObject({ tab: 'claims', trigger: 'click' })
    expect(events[5].properties).toMatchObject({ claim: suffix, from: 'table' })
    expect(events[6].properties).toMatchObject({ claim: suffix, from: 'drawer' })
    expect(events[7].properties).toMatchObject({ claim: suffix })
    expect(events[8].properties).toMatchObject({ to: 'it' })
    expect(new Set(events.map((e) => e.properties.visit_id)).size).toBe(1)
    expectClean(events)

    // Only event requests reach PostHog: no flags, no remote config, no recorder.
    for (const r of posthog.requests) expect(new URL(r.url()).pathname).toMatch(/^\/(e|i\/v0\/e|batch)\/?$/)
    // PostHog stores nothing on the device.
    expect(await page.context().cookies()).toEqual([])
    expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(['fcd.consent', 'fcd.lang'])
    expect(await page.evaluate(() => Object.keys(sessionStorage).sort())).toEqual(['fcd.passcode'])
  })

  test('overview: see all, example stepping, website link, filters', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    const next = page.getByRole('button', { name: 'Next example' })
    if (await next.isEnabled()) await next.click()
    const popup = page.waitForEvent('popup')
    await page.getByRole('link', { name: /↗$/ }).first().click()
    await (await popup).close()
    await page.getByTestId('area-panel').getByRole('button', { name: /^See all/ }).click()
    await page.getByRole('button', { name: 'Red', exact: true }).click()
    await page.getByRole('button', { name: 'Clear filters' }).first().click()
    await page.getByRole('tab', { name: 'How to read it' }).click()
    await page.getByRole('link', { name: 'Full methodology' }).click()
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('methodology_viewed')
    const names = posthog.names()
    for (const name of ['website_clicked', 'see_all_clicked', 'filter_changed', 'filters_cleared', 'methodology_viewed']) expect(names).toContain(name)
    const events = posthog.events()
    expect(events.find((e) => e.event === 'tab_viewed' && e.properties.tab === 'claims')?.properties.trigger).toBe('see_all')
    expect(events.find((e) => e.event === 'filter_changed')?.properties).toMatchObject({ filter: 'light', n_selected: 1 })
    expectClean(events)
  })

  test('a deep link to a claim is reported as such', async ({ page, posthog }) => {
    const claim = loadFixture().firms.find((f) => f.firm_id === TRACKED_FIRM_ID)!.claims[0]
    await page.goto(`${FIRM}?tab=claims&claim=${claim.claim_id}`)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click() // before unlock
    await unlock(page)
    await expect(page.getByTestId('claim-drawer')).toBeVisible()
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('claim_opened')
    const events = posthog.events()
    expect(events.map((e) => e.event)).toEqual(['consent_granted', 'visit_started', 'tab_viewed', 'claim_opened'])
    expect(events[1].properties).toMatchObject({ entry_tab: 'claims', deeplink_claim: true, unlock: 'typed' })
    expect(events[3].properties).toMatchObject({ from: 'deeplink', claim: claim.claim_id.split('-').pop() })
    expectClean(events)
  })

  test('a reload is a new visit: silent unlock, no second consent_granted', async ({ page, posthog }) => {
    // Playwright doesn't report requests a page makes while it unloads, so count the beacons in the page.
    await page.addInitScript(() => {
      const send = navigator.sendBeacon.bind(navigator)
      navigator.sendBeacon = (url, data) => {
        const accepted = send(url, data)
        sessionStorage.setItem('e2e.beacons', `${sessionStorage.getItem('e2e.beacons') ?? ''}${accepted ? 'ok;' : 'refused;'}`)
        return accepted
      }
    })
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('visit_started')
    await page.reload()
    await expect(page.locator('[data-app-state="ready"]')).toBeVisible()
    await expect(banner(page)).toHaveCount(0)
    await expect.poll(() => posthog.names().filter((n) => n === 'visit_started').length, { timeout: 10_000 }).toBe(2)
    const events = posthog.events()
    expect(events.filter((e) => e.event === 'consent_granted')).toHaveLength(1)
    const starts = events.filter((e) => e.event === 'visit_started')
    expect(starts.map((e) => e.properties.unlock)).toEqual(['typed', 'silent'])
    expect(starts[0].properties.visit_id).not.toBe(starts[1].properties.visit_id)
    // Leaving the page sent visit_ended (and a last heartbeat if any time had accumulated) by beacon.
    const beacons = await page.evaluate(() => sessionStorage.getItem('e2e.beacons'))
    expect(beacons).toMatch(/^(ok;){1,2}$/)
    expectClean(events)
  })

  test('pagehide sends the last heartbeat and visit_ended by beacon', async ({ page, posthog }) => {
    await page.clock.install()
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect(banner(page)).toHaveCount(0)
    await page.clock.runFor(4_000)
    // A synthetic pagehide: the page stays alive, so the beacons can be read.
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('visit_ended')
    const events = posthog.events()
    expect(events.slice(-2).map((e) => e.event)).toEqual(['heartbeat', 'visit_ended'])
    const [beat, ended] = events.slice(-2)
    expect(beat.properties.active_ms).toBeGreaterThan(0)
    expect(ended.properties).toMatchObject({ total_active_ms: beat.properties.active_ms, n_events: (ended.properties.seq as number) - 1 })
    // Exactly these two went out as beacons; earlier events use fetch and may still be in flight.
    expect(posthog.requests.filter((r) => r.resourceType() === 'ping')).toHaveLength(2)
    expectClean(events)
  })

  test('a heartbeat after 15 s of active time', async ({ page, posthog }) => {
    await page.clock.install()
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect(banner(page)).toHaveCount(0)
    await page.clock.runFor(16_000)
    await page.clock.runFor(5_000) // let the batch go out
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('heartbeat')
    const beat = posthog.events().find((e) => e.event === 'heartbeat')!
    expect(beat.properties).toMatchObject({ tab: 'overview', drawer_open: false, active_ms: 15_000 })
  })

  test('Lock sends locked and stops tracking', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await page.getByRole('button', { name: 'Lock', exact: true }).click()
    await expect(page.getByLabel('Passcode')).toBeVisible()
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('locked')
    const n = posthog.events().length
    await page.getByRole('button', { name: 'Italiano' }).click()
    await page.waitForTimeout(4000)
    expect(posthog.events()).toHaveLength(n)
  })

})

test.describe('tracking needs a per-firm file', () => {
  test.use({ consent: 'none', dataFile: 'all' })

  test('the demo file with all firms is never tracked, even after Accept', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.waitForTimeout(4000)
    expect(posthog.requests).toHaveLength(0)
  })
})

test.describe('privacy page', () => {
  test.use({ consent: 'none', dataFile: 'tracked' })

  test('is linked from the passphrase screen and opens without the passphrase', async ({ page }) => {
    await page.goto('#/')
    await expect(page.getByLabel('Passcode')).toBeVisible()
    await page.getByRole('contentinfo').getByRole('link', { name: 'Measurement preferences' }).click()
    await expect(page.getByRole('heading', { name: 'Privacy and cookie notice for the 2D4D report page', level: 1 })).toBeVisible()
    await expect(page.getByTestId('privacy-version')).toHaveText('Version 1 · 14 Nov 2026')
    await expect(page.getByLabel('Passcode')).toHaveCount(0)
    await expect(page.getByRole('cell', { name: 'fcd.consent (localStorage)' })).toBeVisible()
    await expect(page.getByTestId('privacy-choice')).toHaveAttribute('data-consent', 'none')
    // In Italian too.
    await page.getByRole('button', { name: 'Italiano' }).click()
    await expect(page.getByRole('heading', { name: 'Informativa privacy e cookie della pagina del report 2D4D', level: 1 })).toBeVisible()
    await expect(page.getByTestId('privacy-version')).toHaveText('Versione 1 · 14 nov 2026')
  })

  test('the footer link is on the report too', async ({ page }) => {
    await openUnlocked(page, FIRM)
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Measurement preferences' })).toBeVisible()
  })

  test('withdrawing stops tracking at once; consent_changed is the last event', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await page.getByRole('contentinfo').getByRole('link', { name: 'Measurement preferences' }).click()
    const choice = page.getByTestId('privacy-choice')
    await expect(choice).toHaveAttribute('data-consent', 'granted')
    await choice.getByRole('button', { name: 'Continue without measurement', exact: true }).click()
    await expect(choice).toHaveAttribute('data-consent', 'denied')
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('consent_changed')
    const events = posthog.events()
    expect(events.at(-1)).toMatchObject({ event: 'consent_changed', properties: { to: 'denied' } })

    await page.goBack()
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await page.getByTestId('claim-row').first().click()
    await page.waitForTimeout(4000)
    expect(posthog.events()).toHaveLength(events.length)
    expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(['fcd.consent'])
  })

  test('accepting on the privacy page starts tracking', async ({ page, posthog }) => {
    await openUnlocked(page, FIRM)
    await page.getByRole('button', { name: 'Continue without measurement', exact: true }).click()
    await page.getByRole('contentinfo').getByRole('link', { name: 'Measurement preferences' }).click()
    await page.getByTestId('privacy-choice').getByRole('button', { name: 'I consent to measurement', exact: true }).click()
    await expect.poll(posthog.names, { timeout: 10_000 }).toContain('visit_started')
    const events = posthog.events()
    expect(events.map((e) => e.event)).toEqual(['consent_granted', 'consent_changed', 'visit_started'])
    expect(events[0].properties).toMatchObject({ where: 'privacy_page' })
    expect(events[2].properties).toMatchObject({ entry_tab: 'none' })
    expectClean(events)
  })
})
