import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { HouseholdFinancePageClient } from '@/components/domains/household-finance/HouseholdFinancePageClient'

export default async function HouseholdFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <HouseholdFinancePageClient itemId={id} />
}
