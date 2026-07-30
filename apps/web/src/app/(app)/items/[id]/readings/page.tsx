import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { ReadingsPageClient } from '@/components/domains/reading/ReadingsPageClient'

export default async function ReadingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <ReadingsPageClient itemId={id} />
}
