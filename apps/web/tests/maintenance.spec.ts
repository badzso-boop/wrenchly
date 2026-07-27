import { test, expect } from '@playwright/test'

test.describe('Maintenance', () => {
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

  test('maintenance tab loads on item detail', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    await expect(page.getByRole('heading', { name: /maintenance log/i })).toBeVisible()
  })

  test('can open add maintenance form', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    // The log form is collapsed behind "+ Log Maintenance" by default.
    await page.getByRole('button', { name: /log maintenance/i }).click()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByLabel(/date/i)).toBeVisible()
  })

  test('can log a maintenance record', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    await page.getByRole('button', { name: /log maintenance/i }).click()

    await page.getByLabel(/title/i).fill('E2E Oil Change')
    await page.getByRole('button', { name: /save record/i }).click()

    await expect(page.getByText('Maintenance record saved')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('E2E Oil Change')).toBeVisible()
  })

  test('maintenance form requires title', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    await page.getByRole('button', { name: /log maintenance/i }).click()

    const saveBtn = page.getByRole('button', { name: /save record/i })
    await expect(saveBtn).toBeDisabled()
  })
})
