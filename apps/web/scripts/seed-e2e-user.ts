import { auth } from '@/lib/auth/auth'

// tests/global-setup.ts logs in as an existing user — it doesn't self-register.
// This script creates that user ahead of time so the login step has someone to
// log in as, whether that's a fresh ephemeral CI database or a persistent one.
const email = process.env.E2E_TEST_EMAIL ?? 'e2e@wrenchly.test'
const password = process.env.E2E_TEST_PASSWORD ?? 'TestPassword123!'

async function main() {
  try {
    await auth.api.signUpEmail({ body: { name: 'E2E Test User', email, password } })
    console.log(`Seeded e2e test user: ${email}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/already exists/i.test(message)) {
      console.log(`e2e test user already exists, nothing to do: ${email}`)
      return
    }
    throw err
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
