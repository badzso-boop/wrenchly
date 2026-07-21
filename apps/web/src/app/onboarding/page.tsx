import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { db } from '@/server/db'
import { OnboardingClient } from '@/components/domains/onboarding/OnboardingClient'

export default async function OnboardingPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  // E2E mock bypass session has no real DB row (and no DB to query against) — skip the check.
  if (session.user.id !== 'mock-user') {
    const state = await db.onboardingState.findUnique({ where: { userId: session.user.id } })
    if (state?.completedAt) redirect('/dashboard')
  }

  return <OnboardingClient />
}
