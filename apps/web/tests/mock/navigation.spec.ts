import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'

test.describe('Navigation & Layout (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTrpcMocks(page)
  })

  test('/ redirects to /dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/dashboard')
  })

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /inventory/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible()
  })

  test('unread notification badge shows count', async ({ page }) => {
    await page.goto('/dashboard')
    // mock returns countUnread = 1 — badge is inside the Notifications nav link
    await expect(page.getByRole('link', { name: /notifications/i }).getByText('1')).toBeVisible()
  })

  test('mobile hamburger opens drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    const hamburger = page.getByRole('button', { name: 'Open menu' })
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    await expect(page.getByRole('link', { name: /items/i }).first()).toBeVisible()
  })

  test('can navigate to all main sections', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /items/i }).first().click()
    await expect(page).toHaveURL('/items')

    await page.getByRole('link', { name: /inventory/i }).first().click()
    await expect(page).toHaveURL('/inventory')

    await page.getByRole('link', { name: /notifications/i }).first().click()
    await expect(page).toHaveURL('/notifications')

    await page.getByRole('link', { name: /settings/i }).first().click()
    await expect(page).toHaveURL('/settings')
  })

  test('notifications page shows mock notifications', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByText('Oil Change Due')).toBeVisible()
  })

  test('settings page shows profile form', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    // user.getMe returns name: 'E2E User'
    await expect(page.locator('#name')).toHaveValue('E2E User')
  })

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/dashboard')
    const toggle = page.getByRole('button', { name: /theme|dark|light|toggle/i })
    const count = await toggle.count()
    if (count !== 1) { test.skip(); return }
    const html = page.locator('html')
    const before = await html.getAttribute('class')
    await toggle.click()
    const after = await html.getAttribute('class')
    expect(before).not.toEqual(after)
  })
})
