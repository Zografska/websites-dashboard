import { claimLight } from '../src/lib/areas'
import { expect, loadFixture, openUnlocked, test, unlock } from './helpers'
import { FIXTURE_ENC } from './paths'

const drawer = (page: import('@playwright/test').Page) => page.getByTestId('claim-drawer')

test.describe('claim drawer', () => {
  test('clicking a row opens it; Back closes it', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?tab=claims')
    const row = page.getByTestId('claim-row').first()
    const id = await row.getAttribute('data-claim-id')
    await row.locator('td').nth(2).click()
    await expect(page).toHaveURL(new RegExp(`claim=${id}`))
    await expect(drawer(page)).toBeVisible()
    await expect(drawer(page).getByText('Why it was flagged')).toBeVisible()
    await expect(drawer(page).getByText('Crawl history')).toHaveCount(0)
    await page.goBack()
    await expect(drawer(page)).toHaveCount(0)
    await expect(page).not.toHaveURL(/claim=/)
  })

  test('the Overview example opens the drawer', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001')
    const text = (await page.getByTestId('area-example').locator('blockquote').innerText()).replace(/[“”]/g, '')
    await page.getByRole('button', { name: 'Open details' }).click()
    await expect(drawer(page).locator('[lang="it"]').first()).toHaveText(text)
  })

  test('shows the light, area, scope, scrape date and confidence', async ({ page }) => {
    const claim = loadFixture().firms[0].claims[0]
    await openUnlocked(page, `#/firm/F001?claim=${claim.claim_id}`)
    await expect(drawer(page).getByTestId('light')).toHaveAttribute('data-light', claimLight(claim))
    await expect(drawer(page).getByTestId('area-chip')).toBeVisible()
    await expect(drawer(page).getByText(/^Scraped \d+ \w{3} 2026$/)).toBeVisible()
    await expect(drawer(page).getByTestId('confidence')).toContainText('not legal severity')
  })

  test('Escape on a deep-linked drawer removes the param', async ({ page }) => {
    const claim = loadFixture().firms[0].claims[0]
    await openUnlocked(page, `#/firm/F001?claim=${claim.claim_id}`)
    await expect(drawer(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer(page)).toHaveCount(0)
    await expect(page).toHaveURL(/#\/firm\/F001$/)
  })

  test('an unknown claim id is dropped from the URL', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?claim=F001-zzzzzz&tab=claims')
    await expect(page).toHaveURL(/#\/firm\/F001\?tab=claims$/)
    await expect(drawer(page)).toHaveCount(0)
  })

  test('F012 shows "Not yet mapped" for a claim without legal refs', async ({ page }) => {
    const claim = loadFixture()
      .firms.find((f) => f.firm_id === 'F012')!
      .claims.find((c) => c.legal_ref.ucpd === null && c.legal_ref.codice_consumo === null)!
    await openUnlocked(page, `#/firm/F012?claim=${claim.claim_id}`)
    await expect(drawer(page).getByTestId('legal-ref')).toHaveText('Not yet mapped')
  })

  test('the context snippet highlights the claim', async ({ page }) => {
    const claim = loadFixture().firms[0].claims.find((c) => c.context_snippet !== '')!
    await openUnlocked(page, `#/firm/F001?claim=${claim.claim_id}`)
    await expect(drawer(page).getByTestId('context-snippet').locator('mark')).toHaveText(claim.text)
  })
})

test('deep link through the gate in a fresh context', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.route('**/data/firms.enc', (r) => r.fulfill({ path: FIXTURE_ENC, contentType: 'application/json' }))
  const claim = loadFixture().firms[0].claims[0]
  const url = `#/firm/F001?claim=${claim.claim_id}`
  await page.goto(url)
  await expect(page.getByLabel('Passcode')).toBeVisible()
  const before = page.url()
  await unlock(page)
  await expect(drawer(page)).toBeVisible()
  await expect(drawer(page).locator('[lang="it"]').first()).toHaveText(claim.text)
  expect(page.url()).toBe(before)
  await context.close()
})
