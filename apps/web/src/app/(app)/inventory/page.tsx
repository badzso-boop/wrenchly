import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { InventoryClient } from '@/components/domains/inventory/InventoryClient'

export default async function InventoryPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <InventoryClient />
}
