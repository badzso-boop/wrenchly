import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { ItemsClient } from '@/components/domains/item/ItemsClient'

export default async function ItemsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <ItemsClient />
}
