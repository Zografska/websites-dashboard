import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { test as base, expect, type Page, type Request } from '@playwright/test'
import type { DataFile } from '../src/lib/types'
import { FIXTURE_ENC, FIXTURE_JSON, TEST_PASSCODE, TRACKED_ENC } from './paths'

export { expect }
export const testPasscode = TEST_PASSCODE

export type TrackedEvent = { event: string; properties: Record<string, unknown> }

/** Decodes one PostHog capture request into its events (gzip, base64 form or plain JSON body). */
function decode(request: Request): TrackedEvent[] {
  const buffer = request.postDataBuffer()
  if (!buffer || buffer.length === 0) return []
  let text: string
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) text = gunzipSync(buffer).toString('utf8')
  else if (buffer.subarray(0, 5).toString('utf8') === 'data=') text = Buffer.from(new URLSearchParams(buffer.toString('utf8')).get('data') ?? '', 'base64').toString('utf8')
  else text = buffer.toString('utf8')
  const body = JSON.parse(text) as TrackedEvent | TrackedEvent[] | { batch: TrackedEvent[] }
  if (Array.isArray(body)) return body
  return 'batch' in body ? body.batch : [body]
}

export type PostHogCapture = {
  /** Every request made to a PostHog host, including ones that aren't events. */
  requests: Request[]
  /** The events sent so far, in `seq` order within each visit. */
  events: () => TrackedEvent[]
  names: () => string[]
}

type Options = {
  /** The stored consent choice the page starts with. `none` shows the banner. */
  consent: 'denied' | 'granted' | 'none'
  /** `all` is the 40-firm demo file; `tracked` is a one-firm file with a `subject_id`. */
  dataFile: 'all' | 'tracked'
}

/**
 * Every test serves a throwaway encrypted fixture in place of public/data/firms.enc, and
 * answers PostHog requests locally so nothing leaves the machine. By default consent is
 * already declined, so the banner is out of the way and no tracking happens.
 */
export const test = base.extend<Options & { posthog: PostHogCapture }>({
  consent: ['denied', { option: true }],
  dataFile: ['all', { option: true }],

  posthog: async ({ context }, use) => {
    const requests: Request[] = []
    await context.route(/^https?:\/\/[^/]*posthog\.com\//, async (route) => {
      requests.push(route.request())
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' })
    })
    const events = () =>
      requests
        .flatMap(decode)
        .sort((a, b) =>
          a.properties.visit_id === b.properties.visit_id ? (a.properties.seq as number) - (b.properties.seq as number) : 0,
        )
    await use({ requests, events, names: () => events().map((e) => e.event) })
  },

  page: async ({ page, consent, dataFile, posthog: _posthog }, use) => {
    await page.route('**/data/firms.enc', (r) =>
      r.fulfill({ path: dataFile === 'tracked' ? TRACKED_ENC : FIXTURE_ENC, contentType: 'application/json' }),
    )
    // posthog-js drops events from automated browsers (navigator.webdriver, "HeadlessChrome" in
    // the user agent or its brands). Look like a normal one, so the specs run the same code path
    // as a real visitor and the app needs no test switch. The user agent is pinned here because
    // Playwright's own override stops applying while a page unloads, which is exactly when
    // `visit_ended` is sent.
    await page.addInitScript(() => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
      Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined })
      Object.defineProperty(Navigator.prototype, 'userAgent', { get: () => ua })
    })
    if (consent !== 'none') {
      // Only when nothing is stored yet, so a choice made during the test survives a reload.
      await page.addInitScript((choice) => {
        if (localStorage.getItem('fcd.consent') === null) {
          localStorage.setItem('fcd.consent', JSON.stringify({ choice, policy_v: 1, at: new Date().toISOString() }))
        }
      }, consent)
    }
    await use(page)
  },
})

export async function unlock(page: Page, passcode = TEST_PASSCODE) {
  await page.getByLabel('Passcode').fill(passcode)
  await page.getByRole('button', { name: 'Unlock' }).click()
}

/** Opens a route and unlocks, waiting until the app is ready. */
export async function openUnlocked(page: Page, hash: string) {
  await page.goto(hash)
  await unlock(page)
  // Not the Lock button: an open modal drawer aria-hides the rest of the page.
  await expect(page.locator('[data-app-state="ready"]')).toBeVisible()
}

let cached: DataFile | null = null
export function loadFixture(): DataFile {
  cached ??= JSON.parse(readFileSync(FIXTURE_JSON, 'utf8')) as DataFile
  return cached
}
