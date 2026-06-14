import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'
import { TEST_INVENTORY } from './fixtures'

test.describe('Inventory (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTrpcMocks(page)
  })

  test('inventory page shows mock items', async ({ page }) => {
    await page.goto('/inventory')
    for (const item of TEST_INVENTORY) {
      await expect(page.getByText(item.name, { exact: true })).toBeVisible()
    }
  })

  test('shows low stock warning for items below min', async ({ page }) => {
    await page.goto('/inventory')
    // Oil Filter has quantity=1, minQuantity=2 → low stock
    await expect(page.getByText(/low stock/i)).toBeVisible()
    await expect(page.getByText('Oil Filter', { exact: true })).toBeVisible()
  })

  test('item count is shown in header', async ({ page }) => {
    await page.goto('/inventory')
    await expect(page.getByText(`${TEST_INVENTORY.length} item`)).toBeVisible()
  })

  test('add item form shows when button is clicked', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/quantity/i)).toBeVisible()
    await expect(page.getByLabel(/unit/i)).toBeVisible()
  })

  test('add item form submit button is disabled without name', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByRole('button', { name: /add to inventory/i })).toBeDisabled()
  })

  test('can fill and submit add item form', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()

    await page.getByLabel(/name/i).fill('WD-40')
    await page.getByLabel(/quantity/i).fill('2')
    await page.getByLabel(/unit/i).fill('cans')
    await page.getByRole('button', { name: /add to inventory/i }).click()

    await expect(page.getByText('Item added')).toBeVisible({ timeout: 5000 })
  })

  test('cancel hides the add form', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByLabel(/name/i)).not.toBeVisible()
  })
})
