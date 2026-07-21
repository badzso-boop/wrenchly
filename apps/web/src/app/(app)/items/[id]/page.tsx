import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { ItemDetailClient } from '@/components/domains/item/ItemDetailClient'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <ItemDetailClient itemId={id} />
}
