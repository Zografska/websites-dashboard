import { expect, openUnlocked, test } from './helpers'

test.describe('language toggle', () => {
  test('switches the UI to Italian and remembers it', async ({ page }) => {
    await openUnlocked(page, '#/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Italiano' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'it')
    await expect(page.getByRole('heading', { name: 'Aziende', level: 1 })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Nome azienda' })).toBeVisible()
    await expect(page.getByTestId('showing')).toHaveText('Aziende 1–15 di 40')
    await expect(page).toHaveTitle('Dashboard dei claim aziendali')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Aziende', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Firms', level: 1 })).toBeVisible()
  })

  test('the gate and methodology are translated; claim text is not', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('button', { name: 'Italiano' }).click()
    await expect(page.getByText('Inserisci il codice di accesso per visualizzare i dati.')).toBeVisible()
    await page.getByLabel('Codice di accesso').fill('wrong passcode here')
    await page.getByRole('button', { name: 'Sblocca' }).click()
    await expect(page.getByRole('alert')).toHaveText('Codice di accesso errato')

    await page.getByRole('button', { name: 'English' }).click()
    await openUnlocked(page, '#/firm/F001')
    const card = page.getByTestId('claim-card').first()
    const claimText = await card.locator('p[lang="it"]').innerText()
    await page.getByRole('button', { name: 'Italiano' }).click()
    await expect(page.getByRole('heading', { name: 'Claim', exact: true })).toBeVisible()
    await expect(card.locator('p[lang="it"]')).toHaveText(claimText)

    await page.goto('#/methodology')
    await expect(page.getByRole('heading', { name: 'Metodologia', level: 1 })).toBeVisible()
    expect(await page.locator('main').innerText()).not.toContain('TODO')
  })
})
