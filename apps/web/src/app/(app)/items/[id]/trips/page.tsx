import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { TripLogPageClient } from '@/components/domains/trip/TripLogPageClient'

export default async function TripsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <TripLogPageClient itemId={id} />
}
