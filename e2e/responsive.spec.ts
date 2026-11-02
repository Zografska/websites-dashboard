import { expect, loadFixture, openUnlocked, test } from './helpers'

const PAGES = ['#/', '#/firm/F001', '#/firm/F001?tab=claims', '#/firm/F003?tab=claims', '#/firm/F001?tab=how', '#/firm/F004', '#/methodology', '#/whatever']
const WIDTHS = [375, 768, 1280]

test.describe('responsive', () => {
  test('the home table hides secondary columns below 700px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await openUnlocked(page, '#/')
    await expect(page.getByRole('columnheader', { name: 'Website' })).toBeHidden()
    await expect(page.getByRole('columnheader', { name: 'Firm name' })).toBeHidden()
    await expect(page.getByRole('columnheader', { name: 'Claims' })).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByRole('columnheader', { name: 'Website' })).toBeVisible()
  })

  for (const [width, side] of [
    [375, 'bottom'],
    [699, 'bottom'],
    [700, 'right'],
    [1280, 'right'],
  ] as const) {
    test(`the drawer opens on the ${side} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      const claim = loadFixture().firms[0].claims[0]
      await openUnlocked(page, `#/firm/F001?claim=${claim.claim_id}`)
      const drawer = page.getByTestId('claim-drawer')
      await expect(drawer).toHaveAttribute('data-side', side)
      await page.waitForTimeout(400) // let the slide-in finish
      const box = (await drawer.boundingBox())!
      if (side === 'bottom') expect(Math.round(box.y + box.height)).toBe(800)
      else expect(Math.round(box.x + box.width)).toBe(width)
    })
  }

  for (const width of WIDTHS) {
    test(`no page scrolls horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openUnlocked(page, PAGES[0])
      for (const hash of PAGES) {
        await page.goto(hash)
        await expect(page.locator('main')).toBeVisible()
        await page.waitForTimeout(150)
        const sw = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(sw, `${hash} at ${width}px`).toBeLessThanOrEqual(width)
      }
    })
  }

  test('claim rows stack into cards below 700px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await openUnlocked(page, '#/firm/F001?tab=claims')
    await expect(page.getByRole('columnheader', { name: 'Reason for review' })).toBeHidden()
    await expect(page.getByTestId('claim-row').first()).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByRole('columnheader', { name: 'Reason for review' })).toBeVisible()
  })

  test('the area list and panel sit side by side only at ≥1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openUnlocked(page, '#/firm/F001')
    const list = (await page.locator('section[aria-labelledby=areas-heading]').boundingBox())!
    const panel = (await page.getByTestId('area-panel').boundingBox())!
    expect(Math.abs(list.y - panel.y)).toBeLessThan(5)
    await page.setViewportSize({ width: 900, height: 900 })
    await page.waitForTimeout(150)
    const list2 = (await page.locator('section[aria-labelledby=areas-heading]').boundingBox())!
    const panel2 = (await page.getByTestId('area-panel').boundingBox())!
    expect(panel2.y).toBeGreaterThan(list2.y + list2.height - 5)
  })
})
