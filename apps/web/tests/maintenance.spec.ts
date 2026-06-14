import { test, expect } from '@playwright/test'

test.describe('Maintenance', () => {
  async function getFirstItemId(page: import('@playwright/test').Page): Promise<string | null> {
    await page.goto('/items')
    const link = page.locator('a[href^="/items/"]').filter({ hasNot: page.locator('[href$="/new"]') }).first()
    if (await link.count() === 0) return null
    const href = await link.getAttribute('href')
    return href?.split('/items/')[1] ?? null
  }

  test('maintenance tab loads on item detail', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    await expect(page.getByText(/log maintenance|maintenance records|no records/i)).toBeVisible()
  })

  test('can open add maintenance form', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByLabel(/date/i)).toBeVisible()
  })

  test('can log a maintenance record', async ({ page }) => {
    const itemId = await getFirstItemId(page)
    if (!itemId) { test.skip(); return }

    await page.goto(`/items/${itemId}`)
    await page.getByRole('link', { name: /maintenance/i }).click()

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

    const saveBtn = page.getByRole('button', { name: /save record/i })
    await expect(saveBtn).toBeDisabled()
  })
})
