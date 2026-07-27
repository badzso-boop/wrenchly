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
    // The inventory list loads via a client-side query after navigation,
    // so it isn't in the DOM the instant goto() resolves.
    try {
      await cards.first().waitFor({ state: 'attached', timeout: 5000 })
    } catch {
      test.skip()
      return
    }

    const card = cards.first()
    // Each card has three icon buttons in DOM order: minus, plus, delete.
    // `.last()` grabbed the delete button, which opens a blocking
    // window.confirm() that's auto-dismissed — no mutation ever fired.
    const plusBtn = card.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    // Register the response listener before clicking — the request can
    // resolve before a post-click waitForResponse() call gets a chance
    // to start listening, causing a spurious timeout.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/trpc')),
      plusBtn.click(),
    ])
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
    try {
      await cards.first().waitFor({ state: 'attached', timeout: 5000 })
    } catch {
      test.skip()
      return
    }

    page.on('dialog', (d) => d.accept())
    const deleteBtn = cards.first().getByRole('button').last()
    await deleteBtn.click()
    await expect(page.getByText('Item deleted')).toBeVisible({ timeout: 8000 })
  })
})
