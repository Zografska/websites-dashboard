// Review screenshots for the owner (Phase 8). Opt-in: SCREENSHOTS=1 npm run test:e2e -- screens
import { expect, loadFixture, openUnlocked, test } from './helpers'

test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture review screenshots')

const claimId = () => loadFixture().firms[0].claims[0].claim_id
const PAGES: [string, () => string][] = [
  ['home', () => '#/'],
  ['firm-F001', () => '#/firm/F001'],
  ['firm-F001-drawer', () => `#/firm/F001?claim=${claimId()}`],
  ['firm-F003', () => '#/firm/F003'],
  ['firm-F004', () => '#/firm/F004'],
  ['firm-F006', () => '#/firm/F006'],
  ['methodology', () => '#/methodology'],
  ['not-found', () => '#/firm/NOPE'],
]

for (const [name, hash] of PAGES)
  for (const width of [375, 1280])
    for (const scheme of ['light', 'dark'] as const)
      test(`${name} ${width} ${scheme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ colorScheme: scheme })
        await openUnlocked(page, hash())
        await expect(page.locator('main')).toBeVisible()
        await page.waitForTimeout(500)
        await page.screenshot({ path: `test-results/screens/${name}-${width}-${scheme}.png`, fullPage: true })
      })

test('gate 375 light', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('#/')
  await expect(page.getByLabel('Passcode')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/gate-375-light.png' })
})
