import { test, expect } from '@playwright/test'
import { features } from '../../src/content/landing'

test.describe('Landing Page (mock)', () => {
  test('navigates to / and shows hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('primary CTA links to /register', async ({ page }) => {
    await page.goto('/')
    const primaryCta = page.getByRole('link', { name: /regisztráció/i }).first()
    await expect(primaryCta).toHaveAttribute('href', '/register')
  })

  test('secondary CTA links to /login', async ({ page }) => {
    await page.goto('/')
    const secondaryCta = page.getByRole('link', { name: /bejelentkezés/i }).first()
    await expect(secondaryCta).toHaveAttribute('href', '/login')
  })

  test('features section renders one card per feature', async ({ page }) => {
    await page.goto('/')
    const featureSection = page.locator('#features')
    await expect(featureSection).toBeVisible()

    // Each feature renders a Card with a CardTitle containing the feature title
    for (const feature of features) {
      await expect(featureSection.getByText(feature.title)).toBeVisible()
    }
  })

  test('how-it-works section is visible', async ({ page }) => {
    await page.goto('/')
    const howItWorksSection = page.locator('#how-it-works')
    await expect(howItWorksSection).toBeVisible()
  })

  test('footer copyright is present', async ({ page }) => {
    await page.goto('/')
    const currentYear = new Date().getFullYear()
    await expect(page.getByText(new RegExp(`© ${currentYear} Wrenchly`))).toBeVisible()
  })

  test('clicking Get started navigates to /register', async ({ page }) => {
    await page.goto('/')
    const getStartedButton = page.getByRole('link', { name: /regisztráció/i }).first()
    await getStartedButton.click()
    await expect(page).toHaveURL('/register')
  })
})
