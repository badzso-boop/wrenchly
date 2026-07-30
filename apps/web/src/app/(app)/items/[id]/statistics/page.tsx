import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { StatisticsPageClient } from '@/components/domains/statistics/StatisticsPageClient'

export default async function StatisticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <StatisticsPageClient itemId={id} />
}
