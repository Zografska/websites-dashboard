import { expect, loadFixture, openUnlocked, test, unlock } from './helpers'
import { FIXTURE_ENC } from './paths'

const drawer = (page: import('@playwright/test').Page) => page.getByTestId('claim-drawer')

test.describe('claim drawer', () => {
  test('clicking a card opens it; Back closes it', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001')
    const card = page.getByTestId('claim-card').first()
    const id = await card.getAttribute('data-claim-id')
    await card.click()
    await expect(page).toHaveURL(new RegExp(`claim=${id}`))
    await expect(drawer(page)).toBeVisible()
    await expect(drawer(page).getByText('Crawl history')).toBeVisible()
    await page.goBack()
    await expect(drawer(page)).toHaveCount(0)
    await expect(page).not.toHaveURL(/claim=/)
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
    await openUnlocked(page, '#/firm/F001?claim=F001-zzzzzz&conf=high')
    await expect(page).toHaveURL(/#\/firm\/F001\?conf=high$/)
    await expect(drawer(page)).toHaveCount(0)
  })

  test('F012 shows "Not yet mapped" for a claim without legal refs', async ({ page }) => {
    const claim = loadFixture()
      .firms.find((f) => f.firm_id === 'F012')!
      .claims.find((c) => c.legal_ref.ucpd === null && c.legal_ref.codice_consumo === null)!
    await openUnlocked(page, `#/firm/F012?claim=${claim.claim_id}`)
    await expect(drawer(page).getByTestId('legal-ref')).toHaveText('Not yet mapped')
  })

  test('F008 history shows the reappearing claim', async ({ page }) => {
    const claim = loadFixture()
      .firms.find((f) => f.firm_id === 'F008')!
      .claims.find((c) => c.seen_in_crawls.join() === 'F008-C01,F008-C02,F008-C04')!
    await openUnlocked(page, `#/firm/F008?claim=${claim.claim_id}`)
    const rows = drawer(page).getByTestId('crawl-history').locator('li')
    await expect(rows).toHaveCount(4)
    await expect(rows.nth(2)).toContainText('Not seen')
    await expect(rows.nth(3)).toContainText('Seen')
    await expect(drawer(page).locator('[lang="it"]').first()).toHaveText(claim.text)
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
