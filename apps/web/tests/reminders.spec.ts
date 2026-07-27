import { test, expect } from '@playwright/test'

test.describe('Reminders', () => {
  async function getFirstItemId(page: import('@playwright/test').Page): Promise<string | null> {
    await page.goto('/items')
    const link = page.locator('a[href^="/items/"]:not([href$="/new"])').first()
    // The item list loads via a client-side query after navigation, so it
    // isn't in the DOM the instant goto() resolves — wait for the real
    // link to actually show up before concluding there isn't one.
    try {
      await link.waitFor({ state: 'attached', timeout: 5000 })
    } catch {
      return null
    }
    const href = await link.getAttribute('href')
    return href?.split('/items/')[1] ?? null
  }

  test('reminders page loads', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}/reminders`)
    await expect(page.getByRole('heading', { name: /reminders/i })).toBeVisible()
  })

  test('can open add reminder form', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}/reminders`)
    // The form is collapsed behind the "Add Reminder" toggle by default.
    await page.getByRole('button', { name: /add reminder/i }).click()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('trigger type changes the config fields', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}/reminders`)
    await page.getByRole('button', { name: /add reminder/i }).click()

    const select = page.getByRole('combobox').first()
    await select.click()
    await page.getByRole('option', { name: /specific date/i }).click()
    await expect(page.getByLabel(/date/i)).toBeVisible()

    await select.click()
    await page.getByRole('option', { name: /odometer/i }).click()
    await expect(page.getByLabel(/km/i)).toBeVisible()
  })

  test('can create an interval reminder', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}/reminders`)
    await page.getByRole('button', { name: /add reminder/i }).click()
    await page.getByLabel(/title/i).fill('E2E Oil Change Reminder')

    const select = page.getByRole('combobox').first()
    await select.click()
    await page.getByRole('option', { name: /repeat every/i }).click()
    await page.getByLabel(/days/i).fill('90')

    await page.getByRole('button', { name: /add reminder/i }).click()
    await expect(page.getByText('Reminder created')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('E2E Oil Change Reminder')).toBeVisible()
  })
})
