import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { NotificationsClient } from '@/components/domains/notification/NotificationsClient'

export default async function NotificationsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <NotificationsClient />
}
