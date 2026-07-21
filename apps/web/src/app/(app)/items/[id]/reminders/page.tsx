import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { ReminderPageClient } from '@/components/domains/reminder/ReminderPageClient'

export default async function RemindersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <ReminderPageClient itemId={id} />
}
