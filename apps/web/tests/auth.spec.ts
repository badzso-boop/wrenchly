import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentication', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('alert').or(page.locator('text=/invalid|incorrect|error/i'))).toBeVisible({ timeout: 8000 })
  })

  test('shows register form and validates fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /create account|register|sign up/i })).toBeVisible()
  })

  test('navigates between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /register|sign up|create account/i }).click()
    await expect(page).toHaveURL(/\/register/)
    await page.getByRole('link', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
