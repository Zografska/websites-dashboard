import { reviewSummary } from '../src/lib/areas'
import { searchFirms } from '../src/lib/home'
import { expect, loadFixture, openUnlocked, test } from './helpers'

test.describe('home', () => {
  test.beforeEach(async ({ page }) => {
    await openUnlocked(page, '#/')
  })

  const search = (page: import('@playwright/test').Page) => page.getByRole('searchbox', { name: 'Search by firm ID or name' })

  test('first page shows 15 firms sorted by review need', async ({ page }) => {
    const expected = searchFirms(loadFixture().firms, '').slice(0, 15).map((f) => f.firm_id)
    await expect(page.getByTestId('firm-row')).toHaveCount(15)
    await expect(page.getByTestId('showing')).toHaveText('Showing 1–15 of 40 firms')
    await expect(page.getByText('Sorted by red areas, then yellow areas.')).toBeVisible()
    expect(await page.getByTestId('firm-row').locator('td:first-child').allInnerTexts()).toEqual(expected)
  })

  test('the review cell shows "n of 5" and the area bar', async ({ page }) => {
    const s = reviewSummary(loadFixture().firms.find((f) => f.firm_id === 'F001')!)!
    const cell = page.getByTestId('firm-row').filter({ hasText: 'F001' }).getByTestId('review-cell')
    await expect(cell).toContainText(`${s.merit} of 5`)
    await expect(cell.getByTestId('area-bar').locator('span')).toHaveCount(5)
  })

  test('searching F00 gives 9 rows', async ({ page }) => {
    await search(page).fill('F00')
    await expect(page.getByTestId('firm-row')).toHaveCount(9)
    expect(page.url()).toContain('q=F00')
  })

  test('searching part of a firm name finds it', async ({ page }) => {
    const f002 = loadFixture().firms.find((f) => f.firm_id === 'F002')!
    const part = f002.firm_name.split(' ')[0].slice(2).toUpperCase()
    await search(page).fill(part)
    await expect(page.getByTestId('firm-row').filter({ hasText: 'F002' })).toHaveCount(1)
  })

  test('page 3 has 10 rows, and Next is disabled there', async ({ page }) => {
    await page.getByRole('link', { name: '3', exact: true }).click()
    await expect(page.getByTestId('firm-row')).toHaveCount(10)
    await expect(page.getByTestId('showing')).toHaveText('Showing 31–40 of 40 firms')
    await expect(page.getByLabel('Go to next page')).toHaveAttribute('aria-disabled', 'true')
    expect(page.url()).toContain('page=3')
  })

  test('an out-of-range page is clamped', async ({ page }) => {
    await page.goto('#/?page=99')
    await expect(page.getByTestId('showing')).toHaveText('Showing 31–40 of 40 firms')
  })

  test('a nonsense search shows the empty state', async ({ page }) => {
    await search(page).fill('zzzz-no-such-firm')
    await expect(page.getByText('No firms match "zzzz-no-such-firm".')).toBeVisible()
    await expect(page.getByTestId('firm-row')).toHaveCount(0)
  })

  test('clicking a row opens the firm, and the back link restores the search', async ({ page }) => {
    await search(page).fill('F00')
    await page.getByTestId('firm-row').filter({ hasText: 'F003' }).locator('td').nth(3).click()
    await expect(page).toHaveURL(/#\/firm\/F003$/)
    await page.getByRole('link', { name: '← All firms' }).click()
    await expect(page).toHaveURL(/#\/\?q=F00$/)
    await expect(search(page)).toHaveValue('F00')
    await expect(page.getByTestId('firm-row')).toHaveCount(9)
  })

  test('F011 shows — for claims and no review summary (no successful scrape)', async ({ page }) => {
    await page.goto('#/?q=F011')
    const row = page.getByTestId('firm-row').filter({ hasText: 'F011' })
    await expect(row.locator('td').nth(3)).toHaveText('—')
    await expect(row.getByTestId('review-cell')).toHaveText('No successful scrape')
  })

  test('the website link opens in a new tab', async ({ page }) => {
    const link = page.getByTestId('firm-row').first().getByRole('link').nth(1)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(link).toHaveText(/\.example$/)
  })
})
