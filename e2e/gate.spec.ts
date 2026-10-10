import { INVALID_ENC } from './paths'
import { expect, openUnlocked, test, unlock } from './helpers'

test.describe('passcode gate', () => {
  test('shows on the home route with the disclaimer', async ({ page }) => {
    await page.goto('#/')
    await expect(page.getByText('Enter the passcode to view the data.')).toBeVisible()
    await expect(page.getByLabel('Passcode')).toBeFocused()
    await expect(page.getByText('Research prototype. Automated detection, not a legal assessment.')).toBeVisible()
  })

  test('a wrong passcode shows an error', async ({ page }) => {
    await page.goto('#/')
    await unlock(page, 'definitely not the passcode')
    await expect(page.getByRole('alert')).toHaveText('Incorrect passcode')
    await expect(page.getByLabel('Passcode')).toBeVisible()
  })

  test('the right passcode unlocks, survives a reload, and Lock brings the gate back', async ({ page }) => {
    await openUnlocked(page, '#/')
    await expect(page.getByTestId('firm-row')).toHaveCount(15)
    await expect(page.getByText('Showing 1–15 of 40 firms')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Lock', exact: true })).toBeVisible()
    await expect(page.getByLabel('Passcode')).toHaveCount(0)
    await page.getByRole('button', { name: 'Lock', exact: true }).click()
    await expect(page.getByLabel('Passcode')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Passcode')).toBeVisible()
  })

  test('a deep link keeps its URL through the gate', async ({ page }) => {
    await page.goto('#/methodology')
    const before = page.url()
    await unlock(page)
    await expect(page.getByRole('heading', { name: 'Methodology', level: 1 })).toBeVisible()
    expect(page.url()).toBe(before)
  })

  test('a missing data file shows the file error', async ({ page }) => {
    await page.unroute('**/data/firms.enc')
    await page.route('**/data/firms.enc', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('#/')
    await expect(page.getByText('Data file not found (data/firms.enc).')).toBeVisible()
  })

  test('invalid data shows the validation screen with the path', async ({ page }) => {
    await page.unroute('**/data/firms.enc')
    await page.route('**/data/firms.enc', (r) => r.fulfill({ path: INVALID_ENC, contentType: 'application/json' }))
    await page.goto('#/')
    await unlock(page)
    await expect(page.getByTestId('data-error')).toContainText('firms[2].claims[0].category: unknown category not_a_category')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })
})
