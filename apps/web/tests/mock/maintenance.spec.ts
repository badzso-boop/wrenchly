import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'

test.describe('Maintenance (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTrpcMocks(page)
  })

  test('maintenance tab shows mock records', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    // Maintenance tab is the default view — records load from maintenance.listByItemId
    await expect(page.getByText('Oil Change', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Brake Pads', { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('add maintenance form is visible after clicking log button', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    await page.getByRole('button', { name: /log maintenance/i }).click()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByLabel(/date/i)).toBeVisible()
  })

  test('save button is disabled when title is empty', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    await page.getByRole('button', { name: /log maintenance/i }).click()
    await expect(page.getByRole('button', { name: /save record/i })).toBeDisabled()
  })

  test('can fill and submit maintenance form', async ({ page }) => {
    await setupTrpcMocks(page, {
      'maintenance.create': () => ({
        id: 'new-maint', title: 'Mock Tyre Rotation', category: 'TYRES',
        performedAt: new Date().toISOString(), odometerValue: null, notes: null, parts: [], itemId: 'mock-item-1',
      }),
    })

    await page.goto('/items/mock-item-1')
    await page.getByRole('button', { name: /log maintenance/i }).click()

    await page.getByLabel(/title/i).fill('Mock Tyre Rotation')
    const saveBtn = page.getByRole('button', { name: /save record/i })
    await expect(saveBtn).toBeEnabled()
    await saveBtn.click()

    await expect(page.getByText('Maintenance record saved')).toBeVisible({ timeout: 5000 })
  })

  test('can add parts to maintenance record', async ({ page }) => {
    await page.goto('/items/mock-item-1')
    await page.getByRole('button', { name: /log maintenance/i }).click()

    await page.getByRole('button', { name: /add part/i }).click()
    await expect(page.getByPlaceholder('Part name')).toBeVisible()
  })
})
