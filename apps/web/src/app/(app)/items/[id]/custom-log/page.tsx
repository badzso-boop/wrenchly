import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { CustomLogPageClient } from '@/components/domains/custom-domain/CustomLogPageClient'

export default async function CustomLogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <CustomLogPageClient itemId={id} />
}
