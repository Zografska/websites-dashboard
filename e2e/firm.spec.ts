import { areaSummaries, reviewSummary } from '../src/lib/areas'
import { expect, loadFixture, openUnlocked, test } from './helpers'

const fixtureFirm = (id: string) => loadFixture().firms.find((f) => f.firm_id === id)!

test.describe('overview', () => {
  test('summary, stat cards and area list match the fixture', async ({ page }) => {
    const f = fixtureFirm('F001')
    const s = reviewSummary(f)!
    await openUnlocked(page, '#/firm/F001')
    await expect(page.getByTestId('preliminary-banner')).toContainText('Preliminary screen:')
    await expect(page.getByTestId('review-summary')).toContainText(`${s.merit} of 5 areas merit review`)
    await expect(page.getByTestId('red-areas')).toContainText(String(s.red))
    await expect(page.getByTestId('yellow-areas')).toContainText(String(s.yellow))
    await expect(page.getByTestId('green-areas')).toContainText(String(s.green))
    const items = page.getByTestId('area-item')
    await expect(items).toHaveCount(5)
    for (const [i, a] of areaSummaries(f).entries()) await expect(items.nth(i)).toHaveAttribute('data-light', a.light)
  })

  test('the first red area is selected by default and shows an example with advice', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001')
    await expect(page.getByTestId('area-panel')).toHaveAttribute('data-area', 'generic')
    await expect(page.getByTestId('area-item').first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('area-example').locator('blockquote[lang="it"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Why it was flagged' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What to verify internally' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Suggested first action' })).toBeVisible()
  })

  test('selecting an area writes focus= and steps through its examples', async ({ page }) => {
    const scope = areaSummaries(fixtureFirm('F001')).find((a) => a.area === 'scope')!
    await openUnlocked(page, '#/firm/F001')
    await page.getByTestId('area-item').filter({ hasText: 'Scope and claim precision' }).click()
    await expect(page).toHaveURL(/[?&]focus=scope(&|$)/)
    const quote = page.getByTestId('area-example').locator('blockquote')
    await expect(quote).toHaveText(`“${scope.claims[0].text}”`)
    await page.getByRole('button', { name: 'Next example' }).click()
    await expect(quote).toHaveText(`“${scope.claims[1].text}”`)
    await expect(page.getByTestId('example-nav')).toContainText(`2 of ${scope.claims.length}`)
  })

  test('"See all" opens Claim examples filtered to the area', async ({ page }) => {
    const n = areaSummaries(fixtureFirm('F001')).find((a) => a.area === 'scope')!.claims.length
    await openUnlocked(page, '#/firm/F001?focus=scope')
    await page.getByRole('button', { name: `See all ${n} claims in this area` }).click()
    await expect(page).toHaveURL(/tab=claims/)
    await expect(page).toHaveURL(/area=scope/)
    await expect(page.getByTestId('claim-row')).toHaveCount(n)
    await expect(page.getByTestId('area-filter')).toHaveText(/Area: Scope and claim precision/)
  })
})

test.describe('claim examples', () => {
  test('lists every claim, red first, with reason and source', async ({ page }) => {
    const f = fixtureFirm('F001')
    await openUnlocked(page, '#/firm/F001?tab=claims')
    const rows = page.getByTestId('claim-row')
    await expect(rows).toHaveCount(f.claims.length)
    await expect(page.getByTestId('claim-count')).toHaveText(`${f.claims.length} claims`)
    await expect(rows.first()).toHaveAttribute('data-light', 'red')
    await expect(rows.last()).toHaveAttribute('data-light', 'yellow')
    await expect(page.getByRole('columnheader', { name: 'Reason for review' })).toBeVisible()
    await expect(page.getByText(/Page screenshots are not captured yet/)).toBeVisible()
  })

  test('the status filter writes light= and filters rows', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?tab=claims')
    await page.getByRole('toolbar', { name: 'Status filter' }).getByRole('button', { name: 'Yellow' }).click()
    await expect(page).toHaveURL(/[?&]light=red(&|$)/)
    for (const light of await page.getByTestId('claim-row').evaluateAll((rs) => rs.map((r) => r.getAttribute('data-light')))) {
      expect(light).toBe('red')
    }
  })

  test('deselecting the last value is ignored', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?tab=claims&light=red')
    await page.getByRole('toolbar', { name: 'Status filter' }).getByRole('button', { name: 'Red' }).click()
    await expect(page).toHaveURL(/light=red/)
  })

  test('the area menu writes area= and stays open', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?tab=claims')
    await page.getByTestId('area-filter').click()
    await page.getByRole('menuitemcheckbox', { name: 'Labels and climate neutrality' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page).toHaveURL(/area=generic,scope,evidence,future/)
    await expect(page.getByTestId('area-filter')).toHaveText(/Area: 4 selected/)
  })

  test('Clear filters removes the params; no matches shows the empty state', async ({ page }) => {
    await openUnlocked(page, '#/firm/F002?tab=claims&light=red')
    await expect(page.getByText('No claims match these filters.')).toBeVisible()
    await page.locator('section[aria-labelledby=claims-heading]').getByRole('button', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL(/#\/firm\/F002\?tab=claims$/)
    await expect(page.getByTestId('claim-row').first()).toBeVisible()
  })

  test('v1 links with cat= and conf= still open', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001?tab=claims&conf=high&cat=generic_green')
    await expect(page.getByTestId('claim-row')).toHaveCount(fixtureFirm('F001').claims.length)
  })
})

test.describe('how to read it', () => {
  test('explains the three colours and the scope', async ({ page }) => {
    await openUnlocked(page, '#/firm/F001')
    await page.getByRole('tab', { name: 'How to read it' }).click()
    await expect(page).toHaveURL(/tab=how/)
    const how = page.getByTestId('how-to-read')
    await expect(how.getByRole('heading', { name: 'Red · review first' })).toBeVisible()
    await expect(how.getByRole('heading', { name: 'Yellow · clarify' })).toBeVisible()
    await expect(how.getByRole('heading', { name: 'Green · no signal found' })).toBeVisible()
    await expect(how).toContainText('Scope of this screen:')
  })
})

test.describe('edge firms', () => {
  test('F004 has no claims: every area is green', async ({ page }) => {
    await openUnlocked(page, '#/firm/F004')
    await expect(page.getByTestId('review-summary')).toContainText('0 of 5 areas merit review')
    await expect(page.getByTestId('area-item').filter({ hasText: 'None found' })).toHaveCount(5)
    await expect(page.getByTestId('area-empty')).toBeVisible()
    await page.getByRole('tab', { name: 'Claim examples' }).click()
    await expect(page.getByText('No claims detected in the sampled pages.')).toBeVisible()
  })

  test('F002 has no red area and opens on the first yellow one', async ({ page }) => {
    await openUnlocked(page, '#/firm/F002')
    await expect(page.getByTestId('red-areas')).toContainText('0')
    const firstYellow = areaSummaries(fixtureFirm('F002')).find((a) => a.light === 'yellow')!.area
    await expect(page.getByTestId('area-panel')).toHaveAttribute('data-area', firstYellow)
  })

  test('F007 notes the partial scrape', async ({ page }) => {
    await openUnlocked(page, '#/firm/F007')
    await expect(page.getByTestId('crawl-note')).toHaveText(/The scrape was partial \(\d+ pages\)\. Some claims may be missing\./)
  })

  test('F011 has no successful scrape', async ({ page }) => {
    await openUnlocked(page, '#/firm/F011')
    await expect(page.getByText('No successful scrape yet.').first()).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(0)
  })

  test('the page title names the firm', async ({ page }) => {
    await openUnlocked(page, '#/firm/F003')
    await expect(page).toHaveTitle('F003 · Firm Claims Dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fixtureFirm('F003').firm_name)
  })
})
