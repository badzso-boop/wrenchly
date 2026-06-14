import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'
import { TEST_ITEMS } from './fixtures'

test.describe('Items (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTrpcMocks(page)
  })

  test('dashboard shows item cards with mock data', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Toyota Corolla')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Husqvarna Lawn Mower')).toBeVisible({ timeout: 10000 })
  })

  test('items list page renders all mock items', async ({ page }) => {
    await page.goto('/items')
    for (const item of TEST_ITEMS) {
      await expect(page.getByText(item.name)).toBeVisible({ timeout: 10000 })
    }
  })

  test('new item form renders and validates', async ({ page }) => {
    await page.goto('/items/new')
    await expect(page.getByLabel(/name/i)).toBeVisible()
    const saveBtn = page.getByRole('button', { name: /save|create|add/i })
    await expect(saveBtn).toBeDisabled()
    await page.getByLabel(/name/i).fill('My New Item')
    await expect(saveBtn).toBeEnabled()
  })

  test('new item form submits and redirects', async ({ page }) => {
    await page.goto('/items/new')
    await page.getByLabel(/name/i).fill('New Test Item')
    const typeSelect = page.getByRole('combobox').first()
    await typeSelect.click()
    await page.getByRole('option', { name: /vehicle/i }).click()
    await page.getByRole('button', { name: /save|create|add/i }).click()
    await expect(page).toHaveURL(/\/items\//, { timeout: 5000 })
  })

  test('item detail page shows name and type badge', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    await expect(page.getByText('Toyota Corolla')).toBeVisible()
    // badge renders type as lowercase 'vehicle'; tab link renders 'Vehicle'
    await expect(page.getByText('vehicle', { exact: true })).toBeVisible()
  })

  test('item detail page shows maintenance and reminders tabs', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    await expect(page.getByRole('link', { name: /maintenance/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /reminders/i })).toBeVisible()
  })
})
