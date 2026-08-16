import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { CollaboratorsPageClient } from '@/components/domains/item/CollaboratorsPageClient'

export default async function CollaboratorsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <CollaboratorsPageClient itemId={id} />
}
