import { expect, loadFixture, openUnlocked, test } from './helpers'

test.describe('firm filters', () => {
  test.beforeEach(async ({ page }) => {
    await openUnlocked(page, '#/firm/F001')
  })

  test('High alone puts conf=high in the URL and shows only High badges', async ({ page }) => {
    const conf = page.getByRole('toolbar', { name: 'Confidence filter' })
    await conf.getByRole('button', { name: 'Medium' }).click()
    await conf.getByRole('button', { name: 'Low' }).click()
    await expect(page).toHaveURL(/[?&]conf=high(&|$)/)
    const badges = page.getByTestId('claim-card').getByTestId('confidence-badge')
    await expect(badges.first()).toBeVisible()
    for (const text of await badges.allInnerTexts()) expect(text).toBe('High')
  })

  test('deselecting the last value is ignored', async ({ page }) => {
    await page.goto('#/firm/F001?conf=high')
    await page.getByRole('toolbar', { name: 'Confidence filter' }).getByRole('button', { name: 'High' }).click()
    await expect(page).toHaveURL(/conf=high/)
  })

  test('Clear filters removes the params', async ({ page }) => {
    await page.goto('#/firm/F001?conf=high&scope=IN_SCOPE&cat=generic_green')
    const clear = page.getByTestId('filter-bar').getByRole('button', { name: 'Clear filters' })
    await expect(clear).toBeEnabled()
    await clear.click()
    await expect(page).toHaveURL(/#\/firm\/F001$/)
    await expect(clear).toBeDisabled()
  })

  test('the category menu writes cat= and stays open', async ({ page }) => {
    await page.getByTestId('category-filter').click()
    await page.getByRole('menuitemcheckbox', { name: 'Certification' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page).toHaveURL(/cat=generic_green,recycled_recyclable/)
    await expect(page.getByTestId('category-filter')).toHaveText(/Category: 6 selected/)
  })

  test('clicking a breakdown bar adds cat=', async ({ page }) => {
    await page.getByTestId('category-breakdown').locator('.recharts-bar-rectangle').first().click()
    await expect(page).toHaveURL(/[?&]cat=[a-z_]+$/)
    await expect(page.getByTestId('category-filter')).not.toHaveText('Category: All')
  })

  test('the strip count matches the fixture', async ({ page }) => {
    const f = loadFixture().firms.find((x) => x.firm_id === 'F001')!
    const latest = [...f.crawls].filter((c) => c.status !== 'failed').at(-1)!.crawl_id
    const present = f.claims.filter((c) => c.seen_in_crawls.includes(latest)).length
    await expect(page.getByTestId('strip-count')).toHaveText(`${f.claims.length} claims (${present} present, ${f.claims.length - present} removed)`)
    await expect(page.getByTestId('claim-card')).toHaveCount(f.claims.length)
    await expect(page.getByTestId('claim-card').first().locator('p[lang="it"]')).toBeVisible()
  })

  test('a filter combination with no matches shows the empty state', async ({ page }) => {
    await page.goto('#/firm/F009?conf=high')
    await expect(page.getByText('No claims match these filters.')).toBeVisible()
    await page.locator('section[aria-labelledby=claims-heading]').getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByTestId('claim-card').first()).toBeVisible()
  })
})

test.describe('edge firms', () => {
  test('F004 has no claims', async ({ page }) => {
    await openUnlocked(page, '#/firm/F004')
    await expect(page.getByText('No claims detected on this site yet.')).toBeVisible()
    await expect(page.getByText('No present claims in the latest crawl.')).toBeVisible()
    await expect(page.getByTestId('confidence-block')).toHaveAttribute('data-highest', 'none')
  })

  test('F002 has a single crawl', async ({ page }) => {
    await openUnlocked(page, '#/firm/F002')
    await expect(page.getByText('Only one crawl so far')).toBeVisible()
  })

  test('F005 marks the failed crawl on the timeline', async ({ page }) => {
    await openUnlocked(page, '#/firm/F005')
    await expect(page.getByTestId('timeline').getByText('Crawl failed')).toBeVisible()
  })

  test('F006 uses the latest successful crawl', async ({ page }) => {
    await openUnlocked(page, '#/firm/F006')
    await expect(page.getByTestId('crawl-meta')).toContainText('(failed)')
    await expect(page.getByText(/latest successful crawl/)).toBeVisible()
  })

  test('F007 notes the partial crawl', async ({ page }) => {
    await openUnlocked(page, '#/firm/F007')
    await expect(page.getByText(/Latest crawl was partial \(\d+ pages\)\. Some claims may be missing\./)).toBeVisible()
  })

  test('F009 and F010 get yellow and orange headers', async ({ page }) => {
    await openUnlocked(page, '#/firm/F009')
    await expect(page.getByTestId('confidence-block')).toHaveAttribute('data-highest', 'low')
    await page.goto('#/firm/F010')
    await expect(page.getByTestId('confidence-block')).toHaveAttribute('data-highest', 'medium')
  })

  test('F011 has no successful crawl', async ({ page }) => {
    await openUnlocked(page, '#/firm/F011')
    await expect(page.getByText('No successful crawl yet.')).toBeVisible()
  })

  test('the page title names the firm', async ({ page }) => {
    await openUnlocked(page, '#/firm/F003')
    await expect(page).toHaveTitle('F003 · Firm Claims Dashboard')
    await expect(page.getByTestId('claim-card')).toHaveCount(loadFixture().firms[2].claims.length)
  })
})
