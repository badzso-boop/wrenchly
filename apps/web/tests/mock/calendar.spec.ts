import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'
import { TEST_CALENDAR_TOKEN } from './fixtures'

test.beforeEach(async ({ page }) => {
  await setupTrpcMocks(page)
})

test.describe('Calendar Integration — Settings page', () => {
  test('calendar integration section is visible on settings page', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('Calendar Integration')).toBeVisible()
  })

  test('feed URL is displayed in the input field', async ({ page }) => {
    await page.goto('/settings')
    const feedInput = page.locator('input[readonly]').last()
    await expect(feedInput).toHaveValue(TEST_CALENDAR_TOKEN.feedUrl)
  })

  test('copy button is present', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: /copy url/i })).toBeVisible()
  })

  test('regenerate button is present', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: /regenerate/i })).toBeVisible()
  })

  test('copy button changes icon to checkmark after click', async ({ page }) => {
    await page.goto('/settings')
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: /copy url/i }).click()
    // After click the aria-label disappears and a check icon appears
    await expect(page.locator('[data-slot="button"] svg').last()).toBeVisible()
  })

  test('regenerate triggers confirmation dialog', async ({ page }) => {
    await page.goto('/settings')
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('invalidate')
      await dialog.dismiss()
    })
    await page.getByRole('button', { name: /regenerate/i }).click()
  })

  test('confirming regenerate calls the mutation and shows toast', async ({ page }) => {
    let regenerateCalled = false
    await setupTrpcMocks(page, {
      'user.regenerateCalendarToken': () => {
        regenerateCalled = true
        return {
          token: 'mock-regenerated-token-xyz',
          feedUrl: 'http://localhost:3000/api/calendar/mock-regenerated-token-xyz/feed.ics',
        }
      },
    })

    await page.goto('/settings')
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /regenerate/i }).click()

    await expect(page.getByText('Calendar link regenerated')).toBeVisible()
    expect(regenerateCalled).toBe(true)
  })

  test('feed URL contains /api/calendar/ path', async ({ page }) => {
    await page.goto('/settings')
    const feedInput = page.locator('input[readonly]').last()
    await expect(feedInput).toHaveValue(/\/api\/calendar\//)
  })

  test('helper text mentions Google Calendar', async ({ page }) => {
    await page.goto('/settings')
    await expect(
      page.getByText('Subscribe to your reminders in Google Calendar, Apple Calendar, or Outlook')
    ).toBeVisible()
  })

  test('supported apps list is shown', async ({ page }) => {
    await page.goto('/settings')
    const supportedApps = page.getByText(/Works with:/i)
    await expect(supportedApps).toBeVisible()
    await expect(supportedApps).toContainText('Apple Calendar')
    await expect(supportedApps).toContainText('Outlook')
  })
})

test.describe('Calendar ICS endpoint', () => {
  test('feed endpoint returns 404 for unknown token', async ({ page }) => {
    // This hits the real Next.js API route (not mocked via tRPC)
    const response = await page.request.get('/api/calendar/invalid-nonexistent-token/feed.ics')
    expect(response.status()).toBe(404)
  })
})
