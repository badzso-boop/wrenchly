import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { CookingLogPageClient } from '@/components/domains/cooking/CookingLogPageClient'

export default async function CookingLogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <CookingLogPageClient itemId={id} />
}
