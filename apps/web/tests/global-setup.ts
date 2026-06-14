import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0]!.use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const email = process.env.E2E_TEST_EMAIL ?? 'e2e@wrenchly.test'
  const password = process.env.E2E_TEST_PASSWORD ?? 'TestPassword123!'

  await page.goto(`${baseURL}/login`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(`${baseURL}/dashboard`, { timeout: 15000 })

  await page.context().storageState({ path: './tests/.auth/user.json' })
  await browser.close()
}

export default globalSetup
