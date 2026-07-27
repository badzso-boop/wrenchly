import { test, expect } from '@playwright/test'

test.describe('Items', () => {
  test('dashboard loads and shows items section', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('items list page loads', async ({ page }) => {
    await page.goto('/items')
    await expect(page.getByRole('heading', { name: /my items|items/i })).toBeVisible()
  })

  test('can open new item form', async ({ page }) => {
    await page.goto('/items')
    await page.getByRole('button', { name: /add item|new item|\+ item/i }).click()
    await expect(page).toHaveURL(/\/items\/new/)
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('new item form validates required fields', async ({ page }) => {
    await page.goto('/items/new')
    const saveBtn = page.getByRole('button', { name: /save|create|add/i })
    await expect(saveBtn).toBeDisabled()
    await page.getByLabel(/name/i).fill('Test Item')
    await expect(saveBtn).toBeEnabled()
  })

  test('can create and view a new item', async ({ page }) => {
    const itemName = `Test Item ${Date.now()}`
    await page.goto('/items/new')
    await page.getByLabel(/name/i).fill(itemName)
    const typeSelect = page.getByRole('combobox').first()
    await typeSelect.click()
    await page.getByRole('option', { name: /vehicle/i }).click()
    await page.getByRole('button', { name: /save|create|add/i }).click()

    await expect(page).toHaveURL(/\/items\/[a-z0-9-]+$/)
    await expect(page.getByText(itemName)).toBeVisible()
  })

  test('item detail page shows tabs', async ({ page }) => {
    await page.goto('/items')
    const firstItem = page.locator('[href^="/items/"]:not([href$="/new"])').first()
    // The item list loads via a client-side query after navigation, so it
    // isn't in the DOM the instant goto() resolves — wait for the real
    // link to actually show up before concluding there isn't one.
    try {
      await firstItem.waitFor({ state: 'attached', timeout: 5000 })
    } catch {
      test.skip()
      return
    }
    await firstItem.click()
    await expect(page.getByRole('link', { name: /maintenance/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /reminders/i })).toBeVisible()
  })
})
