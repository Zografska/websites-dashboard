import { readFileSync } from 'node:fs'
import { test as base, expect, type Page } from '@playwright/test'
import type { DataFile } from '../src/lib/types'
import { FIXTURE_ENC, FIXTURE_JSON, TEST_PASSCODE } from './paths'

export { expect }
export const testPasscode = TEST_PASSCODE

/** Every test serves the throwaway encrypted fixture in place of public/data/firms.enc. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/data/firms.enc', (r) => r.fulfill({ path: FIXTURE_ENC, contentType: 'application/json' }))
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
