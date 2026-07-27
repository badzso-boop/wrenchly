import { auth } from '@/lib/auth/auth'
import { db } from '@/server/db'

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
    if (!/already exists/i.test(message)) throw err
    console.log(`e2e test user already exists, nothing to do: ${email}`)
  }

  // The dashboard redirects to /onboarding until this row has a
  // completedAt — without it, every test that lands on /dashboard gets
  // bounced to /onboarding instead.
  const user = await db.user.findUniqueOrThrow({ where: { email } })
  await db.onboardingState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, completedAt: new Date(), selectedHobbies: [] },
    update: { completedAt: new Date() },
  })
  console.log(`Marked onboarding complete for: ${email}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
