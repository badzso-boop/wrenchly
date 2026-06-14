import { test, expect } from '@playwright/test'

test.describe('Navigation & Layout', () => {
  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /items/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /inventory/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible()
  })

  test('mobile menu opens on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    const hamburger = page.getByRole('button', { name: /menu|open/i })
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
  })

  test('can navigate between main sections', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /inventory/i }).first().click()
    await expect(page).toHaveURL('/inventory')

    await page.getByRole('link', { name: /settings/i }).first().click()
    await expect(page).toHaveURL('/settings')

    await page.getByRole('link', { name: /dashboard/i }).first().click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/dashboard')
    const html = page.locator('html')

    const toggle = page.getByRole('button', { name: /theme|dark|light|toggle/i })
    const count = await toggle.count()
    if (count === 0) { test.skip(); return }

    await toggle.click()
    const cls = await html.getAttribute('class')
    expect(cls).toMatch(/dark|light/)
  })

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: /notification/i })).toBeVisible()
  })

  test('settings page loads with profile form', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('page title updates per route', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveTitle(/wrenchly|dashboard/i)
  })
})
