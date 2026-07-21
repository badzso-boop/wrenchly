import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { ProfilePageClient } from '@/components/domains/profile/ProfilePageClient'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <ProfilePageClient itemId={id} />
}
