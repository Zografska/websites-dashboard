import { expect, openUnlocked, test } from './helpers'

test.describe('methodology and not found', () => {
  test('methodology renders the tables without TODOs', async ({ page }) => {
    await openUnlocked(page, '#/methodology')
    await expect(page.getByRole('heading', { name: 'Methodology', level: 1 })).toBeVisible()
    await expect(page.locator('article table').first()).toBeVisible()
    await expect(page.locator('article table')).toHaveCount(2)
    const text = await page.locator('main').innerText()
    expect(text).not.toContain('TODO')
    expect(text).not.toContain('Firms:')
    await expect(page).toHaveTitle('Methodology · Firm Claims Dashboard')
  })

  test('external links open in a new tab', async ({ page }) => {
    await openUnlocked(page, '#/methodology')
    const link = page.locator('article a[href^="https://www.normattiva.it"]')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('an unknown firm shows Not found', async ({ page }) => {
    await openUnlocked(page, '#/firm/NOPE')
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Back to all firms' }).click()
    await expect(page.getByTestId('firm-row')).toHaveCount(15)
  })

  test('an unknown route shows Not found', async ({ page }) => {
    await openUnlocked(page, '#/whatever')
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
    await expect(page.getByText("That page or firm doesn't exist.")).toBeVisible()
  })
})

/** Relative luminance of a CSS color, resolved through a canvas (handles oklch). */
async function bodyLuminance(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3), (v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  })
}

test.describe('dark mode', () => {
  test('follows the system color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await openUnlocked(page, '#/')
    expect(await bodyLuminance(page)).toBeLessThan(0.2)
    await page.emulateMedia({ colorScheme: 'light' })
    expect(await bodyLuminance(page)).toBeGreaterThan(0.8)
  })
})
