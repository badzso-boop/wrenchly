import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { VehiclePageClient } from '@/components/domains/vehicle/VehiclePageClient'

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <VehiclePageClient itemId={id} />
}
