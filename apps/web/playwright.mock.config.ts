import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/mock',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_E2E_TEST_BYPASS: 'true',
      SKIP_ENV_VALIDATION: 'true',
      PORT: '3001',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
      // Minimal server-side fakes (never called due to bypass + route mocking)
      DATABASE_URL: 'postgresql://localhost/mock',
      DIRECT_URL: 'postgresql://localhost/mock',
      BETTER_AUTH_SECRET: 'fake-better-auth-secret-e2e-mock-32-chars-min',
      RESEND_API_KEY: 'fake-resend-key-e2e-mock',
      UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-upstash-token-e2e-mock',
      CRON_SECRET: 'fake-cron-secret-at-least-32-chars-long',
    },
  },
})
