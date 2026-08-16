import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { FriendsClient } from '@/components/domains/friend/FriendsClient'

export default async function FriendsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <FriendsClient />
}
