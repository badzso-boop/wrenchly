import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // tests/mock has its own suite + config (playwright.mock.config.ts) that runs
  // against a bypassed-auth dev server. Without this, testDir's default recursive
  // scan picks those specs up here too and runs them against the real backend,
  // where the mocked-auth assumptions they're written against don't hold.
  testIgnore: '**/mock/**',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: './tests/.auth/user.json',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
