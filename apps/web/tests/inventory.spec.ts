import { test, expect } from '@playwright/test'

test.describe('Inventory', () => {
  test('inventory page loads', async ({ page }) => {
    await page.goto('/inventory')
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible()
  })

  test('can open add item form', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/quantity/i)).toBeVisible()
  })

  test('can create an inventory item', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()

    await page.getByLabel(/name/i).fill('E2E Test Oil')
    await page.getByLabel(/quantity/i).fill('3')
    await page.getByLabel(/unit/i).fill('L')

    await page.getByRole('button', { name: /add to inventory/i }).click()
    await expect(page.getByText('Item added')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('E2E Test Oil')).toBeVisible()
  })

  test('can adjust quantity with +/- buttons', async ({ page }) => {
    await page.goto('/inventory')

    const cards = page.locator('[class*="card"]').filter({ hasText: 'E2E Test Oil' })
    const count = await cards.count()
    if (count === 0) { test.skip(); return }

    const card = cards.first()
    const plusBtn = card.getByRole('button').filter({ has: page.locator('svg') }).last()
    await plusBtn.click()
    await page.waitForResponse((r) => r.url().includes('/api/trpc'))
  })

  test('low stock warning appears when quantity at or below min', async ({ page }) => {
    await page.goto('/inventory')
    await page.getByRole('button', { name: /add item/i }).click()

    await page.getByLabel(/name/i).fill('E2E Sparse Widget')
    await page.getByLabel(/quantity/i).fill('1')
    await page.getByLabel(/unit/i).fill('pcs')
    await page.getByLabel(/min alert/i).fill('2')

    await page.getByRole('button', { name: /add to inventory/i }).click()
    await expect(page.getByText('Item added')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/low stock/i)).toBeVisible()
  })

  test('can delete an inventory item', async ({ page }) => {
    await page.goto('/inventory')

    const cards = page.locator('[class*="card"]').filter({ hasText: 'E2E Test Oil' })
    if (await cards.count() === 0) { test.skip(); return }

    page.on('dialog', (d) => d.accept())
    const deleteBtn = cards.first().getByRole('button').last()
    await deleteBtn.click()
    await expect(page.getByText('Item deleted')).toBeVisible({ timeout: 8000 })
  })
})
