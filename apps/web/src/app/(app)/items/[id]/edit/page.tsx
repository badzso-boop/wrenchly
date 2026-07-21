import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { EditItemClient } from '@/components/domains/item/EditItemClient'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <EditItemClient itemId={id} />
}
