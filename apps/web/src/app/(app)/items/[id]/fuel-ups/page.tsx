import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { FuelUpPageClient } from '@/components/domains/fuel-up/FuelUpPageClient'

export default async function FuelUpsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <FuelUpPageClient itemId={id} />
}
